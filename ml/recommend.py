
import sys
import json
import sqlite3
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

# Database path
DB_PATH = '../database/smart_retail.db'

def get_db_transactions():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get all OrderItems grouped by OrderID
        cursor.execute("SELECT OrderID, ProductID FROM OrderItems")
        rows = cursor.fetchall()
        
        transactions_dict = {}
        for order_id, product_id in rows:
            if order_id not in transactions_dict:
                transactions_dict[order_id] = []
            transactions_dict[order_id].append(product_id)
            
        conn.close()
        return list(transactions_dict.values())
    except Exception as e:
        # If DB fails, return empty list
        return []

# Dummy transactions (using Product IDs)
# 1-10: Groceries
# 11-15: Sports
# 16-20: Medical
# 21-25: Electrical
# 26-31: Beauty
dummy_transactions = [
    # Groceries
    [1, 2, 4], [1, 3, 5], [2, 4, 5], [1, 2, 5, 7], [3, 4, 6],
    [1, 5, 8], [2, 3, 9], [4, 5, 10], [1, 2, 3], [5, 7, 6],
    
    # Sports
    [11, 12], [11, 15], [12, 13], [14, 15], [11, 12, 15],
    
    # Medical
    [16, 17], [16, 18], [17, 20], [18, 19], [16, 17, 20],
    
    # Electrical
    [21, 24], [22, 23], [21, 24, 22], [23, 25], [22, 25],
    
    # Beauty
    [26, 28], [27, 29], [26, 28, 30], [29, 31], [27, 30],
    
    # Mixed
    [1, 16], [11, 23], [26, 21]
]

def get_recommendations(cart_items, rules):
    recommendations = {} # Map item -> max_confidence
    cart_items_set = set(cart_items)
    
    # Find rules where antecedents are a subset of cart items
    # We want to find consequents that are implied by items in the cart
    
    for _, rule in rules.iterrows():
        antecedents = rule['antecedents']
        consequents = rule['consequents']
        
        # If the cart contains the antecedents
        if antecedents.issubset(cart_items_set):
            for item in consequents:
                if item not in cart_items_set:
                    conf = rule['confidence']
                    if item not in recommendations or conf > recommendations[item]:
                        recommendations[item] = conf

    # Convert to list and sort by confidence
    rec_list = list(recommendations.items())
    rec_list.sort(key=lambda x: x[1], reverse=True)
    
    # Return top 5 product IDs
    return [item[0] for item in rec_list[:5]]

if __name__ == "__main__":
    try:
        # Load input items
        input_items = json.loads(sys.argv[1])
        # Ensure items are integers
        cart_items = [int(x) for x in input_items]

        # Combine transactions
        db_transactions = get_db_transactions()
        all_transactions = dummy_transactions + db_transactions
        
        # If no transactions, return empty
        if not all_transactions:
            print(json.dumps([]))
            sys.exit(0)

        # One-hot encode
        te = TransactionEncoder()
        te_ary = te.fit(all_transactions).transform(all_transactions)
        df = pd.DataFrame(te_ary, columns=te.columns_)

        # Apriori
        # Lower min_support to allow more rules with sparse data
        frequent_itemsets = apriori(df, min_support=0.05, use_colnames=True)
        
        if frequent_itemsets.empty:
            print(json.dumps([]))
            sys.exit(0)

        # Association Rules
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.1)
        
        # Get recommendations
        recs = get_recommendations(cart_items, rules)
        
        print(json.dumps(recs))

    except Exception as e:
        # In case of any error, print empty list to avoid breaking frontend
        # print(f"Error: {e}", file=sys.stderr)
        print(json.dumps([]))
