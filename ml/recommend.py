
import sys
import json
import sqlite3
import warnings
warnings.filterwarnings('ignore')

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

def get_product_names():
    """Fetch product names from the database for richer output."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT ProductID, Name, Price, Category, Stock FROM Products")
        rows = cursor.fetchall()
        conn.close()
        products = {}
        for pid, name, price, category, stock in rows:
            products[pid] = {
                'ProductID': pid,
                'Name': name,
                'Price': price,
                'Category': category,
                'Stock': stock
            }
        return products
    except Exception:
        return {}

# Dummy transactions (using Product IDs)
# 1-10: Groceries
# 11-15: Sports
# 16-20: Medical
# 21-25: Electrical
# 26-31: Beauty
dummy_transactions = [
    # Groceries — strong associations: (1,2), (1,5), (4,5), (2,5)
    [1, 2, 4], [1, 3, 5], [2, 4, 5], [1, 2, 5, 7], [3, 4, 6],
    [1, 5, 8], [2, 3, 9], [4, 5, 10], [1, 2, 3], [5, 7, 6],
    [1, 2, 5], [1, 4, 5], [2, 5, 6], [1, 2, 7], [3, 5, 4],
] * 5 + [
    # Sports — strong associations: (11,12), (11,15)
    [11, 12], [11, 15], [12, 13], [14, 15], [11, 12, 15],
    [11, 12, 14], [11, 13, 15],
] * 6 + [
    # Medical — strong associations: (16,17), (16,20)
    [16, 17], [16, 18], [17, 20], [18, 19], [16, 17, 20],
    [16, 17, 18], [16, 20, 19],
] * 6 + [
    # Electrical — strong associations: (21,24), (22,25)
    [21, 24], [22, 23], [21, 24, 22], [23, 25], [22, 25],
    [21, 22, 24], [22, 23, 25],
] * 6 + [
    # Beauty — strong associations: (26,28), (27,30)
    [26, 28], [27, 29], [26, 28, 30], [29, 31], [27, 30],
    [26, 27, 28], [26, 28, 31],
] * 6 + [
    # Cross-Category: Sports + Medical (e.g., injuries)
    [11, 12, 16, 17], [11, 16, 18], [12, 16, 17, 20], [11, 15, 16, 17],
    [13, 16, 18], [14, 16, 17], [11, 12, 16, 20], [15, 16, 17],
] * 4 + [
    # Cross-Category: Grocery + Beauty (e.g., daily essentials)
    [1, 2, 26, 28], [1, 5, 27, 30], [2, 4, 26, 28], [1, 26, 27],
    [4, 5, 26, 28], [3, 27, 30], [1, 4, 26, 28], [2, 5, 29, 31],
] * 4 + [
    # Cross-Category: Electrical + Medical
    [21, 24, 16, 17], [22, 25, 16, 18], [21, 16, 17], [24, 16, 20],
] * 4 + [
    # Mixed / random noise
    [1, 16], [11, 23], [26, 21],
    [1, 6, 9], [2, 4, 10], [1, 2, 4, 5],
] * 5

def get_recommendations(cart_items, rules):
    """Basic recommendations — returns list of product IDs."""
    recommendations = {}  # Map item -> max_confidence
    cart_items_set = set(cart_items)
    
    for _, rule in rules.iterrows():
        antecedents = rule['antecedents']
        consequents = rule['consequents']
        
        if antecedents.issubset(cart_items_set):
            for item in consequents:
                if item not in cart_items_set:
                    conf = rule['confidence']
                    if item not in recommendations or conf > recommendations[item]:
                        recommendations[item] = conf

    rec_list = list(recommendations.items())
    rec_list.sort(key=lambda x: x[1], reverse=True)
    
    return [item[0] for item in rec_list[:5]]


def get_detailed_recommendations(cart_items, rules, frequent_itemsets):
    """
    Enhanced recommendations with confidence, support, and rule details.
    Returns a list of dicts: { productId, confidence, support, antecedents, ruleName }
    """
    recommendations = {}
    cart_items_set = set(cart_items)
    
    for _, rule in rules.iterrows():
        antecedents = rule['antecedents']
        consequents = rule['consequents']
        
        if antecedents.issubset(cart_items_set):
            for item in consequents:
                if item not in cart_items_set:
                    conf = float(rule['confidence'])
                    sup = float(rule['support'])
                    lift_val = float(rule['lift']) if 'lift' in rule else 1.0
                    
                    if item not in recommendations or conf > recommendations[item]['confidence']:
                        recommendations[item] = {
                            'productId': int(item),
                            'confidence': round(conf, 4),
                            'support': round(sup, 4),
                            'lift': round(lift_val, 4),
                            'antecedents': [int(a) for a in antecedents],
                            'consequents': [int(item)]
                        }

    rec_list = list(recommendations.values())
    rec_list.sort(key=lambda x: x['confidence'], reverse=True)
    
    return rec_list[:8]  # Return top 8 for checkout page


if __name__ == "__main__":
    try:
        # Parse arguments
        input_items = json.loads(sys.argv[1])
        cart_items = [int(x) for x in input_items]
        
        # Parse optional parameters
        min_sup = 0.05
        min_conf = 0.1
        mode = 'simple'  # 'simple' returns IDs only, 'detailed' returns full data
        
        if len(sys.argv) > 2:
            try:
                min_sup = float(sys.argv[2])
            except ValueError:
                pass
        if len(sys.argv) > 3:
            try:
                min_conf = float(sys.argv[3])
            except ValueError:
                pass
        if len(sys.argv) > 4:
            mode = sys.argv[4]

        # Clamp min_support and min_confidence to valid ranges
        min_sup = max(0.01, min(1.0, min_sup))
        min_conf = max(0.01, min(1.0, min_conf))

        # Combine transactions
        db_transactions = get_db_transactions()
        all_transactions = dummy_transactions + db_transactions
        
        if not all_transactions:
            print(json.dumps([]))
            sys.exit(0)

        # One-hot encode
        te = TransactionEncoder()
        te_ary = te.fit(all_transactions).transform(all_transactions)
        df = pd.DataFrame(te_ary, columns=te.columns_)

        # Apriori algorithm — find frequent itemsets
        frequent_itemsets = apriori(df, min_support=min_sup, use_colnames=True)
        
        if frequent_itemsets.empty:
            print(json.dumps([]))
            sys.exit(0)

        # Association Rules with configurable min_confidence
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_conf)
        
        if rules.empty:
            print(json.dumps([]))
            sys.exit(0)

        if mode == 'detailed':
            # Return rich recommendation data with confidence/support/lift
            recs = get_detailed_recommendations(cart_items, rules, frequent_itemsets)
            
            # Also include algorithm metadata
            output = {
                'recommendations': recs,
                'metadata': {
                    'totalTransactions': len(all_transactions),
                    'totalRules': len(rules),
                    'totalFrequentItemsets': len(frequent_itemsets),
                    'minSupport': min_sup,
                    'minConfidence': min_conf,
                    'algorithm': 'Apriori + Association Rule Mining'
                }
            }
            print(json.dumps(output))
        else:
            # Simple mode — return list of product IDs only (backward compatible)
            recs = get_recommendations(cart_items, rules)
            print(json.dumps(recs))

    except Exception as e:
        # In case of any error, print empty list to avoid breaking frontend
        import traceback
        print(json.dumps([]), flush=True)
        traceback.print_exc(file=sys.stderr)
