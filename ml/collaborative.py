import sys
import json
import sqlite3
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

DB_PATH = '../database/smart_retail.db'

# Dummy historical interactions (UserID: [ProductID1, ProductID2, ...])
DUMMY_INTERACTIONS = {
    # Food/Groceries buyers
    9001: [1, 2, 4, 5, 8],
    9002: [1, 3, 5, 6],
    9003: [2, 4, 5, 7, 10],
    
    # Sports guys
    9004: [11, 12, 14, 15],
    9005: [11, 13, 15],
    9006: [12, 13, 14],
    
    # Beauty & Medical
    9007: [26, 27, 28, 16],
    9008: [28, 29, 30, 31, 17],
    9009: [26, 28, 16, 18],
    
    # Electrical/Tech
    9010: [21, 22, 23, 24, 25],
    9011: [21, 23, 25],
    9012: [22, 24, 25],

    # Mixed
    9013: [1, 11, 21, 26]
}

def get_db_interactions():
    interactions = []
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT o.UserID, oi.ProductID 
            FROM Orders o 
            JOIN OrderItems oi ON o.OrderID = oi.OrderID
        """)
        rows = cursor.fetchall()
        for uid, pid in rows:
            interactions.append({'UserID': uid, 'ProductID': pid, 'Purchased': 1})
        conn.close()
    except Exception as e:
        pass
    return interactions

def cosine_similarity_np(matrix):
    # Calculate cosine similarity using pure numpy
    dot_product = np.dot(matrix, matrix.T)
    norms = np.linalg.norm(matrix, axis=1)
    # Handle zero vectors to avoid division by zero
    norms[norms == 0] = 1e-10 
    norm_matrix = np.outer(norms, norms)
    return dot_product / norm_matrix

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps([]))
            sys.exit(0)
            
        target_user = int(sys.argv[1])
        
        # 1. Gather all data
        data_rows = get_db_interactions()
        
        # Add dummy data
        for uid, pids in DUMMY_INTERACTIONS.items():
            for pid in pids:
                data_rows.append({'UserID': uid, 'ProductID': pid, 'Purchased': 1})
                
        if not data_rows:
            print(json.dumps([]))
            sys.exit(0)
            
        df = pd.DataFrame(data_rows)
        
        # We only care about distinct purchases for simplicity (binary interaction)
        df = df.drop_duplicates(subset=['UserID', 'ProductID'])
        
        # If the target user has no history, we can't do collaborative filtering for them
        # We could return global top sellers, but here we just return empty so UI handles cold-start.
        if target_user not in df['UserID'].values:
            # Fallback: Top 5 global most popular products
            top_products = df['ProductID'].value_counts().head(5).index.tolist()
            print(json.dumps(top_products))
            sys.exit(0)
            
        # 2. Build User-Item Matrix
        # Rows: Users, Cols: Products, Values: 1 if purchased else 0
        user_item_matrix = df.pivot(index='UserID', columns='ProductID', values='Purchased').fillna(0)
        
        # Keep track of user ids
        user_ids = user_item_matrix.index.tolist()
        
        # Find index of our target user
        if target_user not in user_ids:
            print(json.dumps([]))
            sys.exit(0)
            
        target_idx = user_ids.index(target_user)
        
        # Convert to numpy array for fast computation
        matrix_data = user_item_matrix.values
        
        # 3. Calculate User-User Cosine Similarity
        user_similarities = cosine_similarity_np(matrix_data)
        
        # 4. Get similarities for the target user
        target_similarities = user_similarities[target_idx]
        
        # 5. Find the top K most similar users (excluding themselves)
        # Create a series to easily sort
        sim_series = pd.Series(target_similarities, index=user_ids)
        sim_series = sim_series.drop(target_user) # Remove self
        
        # Get top 5 most similar users
        top_similar_users = sim_series.sort_values(ascending=False).head(5)
        
        # 6. Find products these similar users bought
        # Filter matrix to only those similar users
        similar_users_matrix = user_item_matrix.loc[top_similar_users.index]
        
        # Target user's current purchases
        target_purchases = set(user_item_matrix.loc[target_user][user_item_matrix.loc[target_user] > 0].index)
        
        # Calculate product scores based on how many similar users bought them, weighted by similarity
        recommended_scores = {}
        for sim_user_id, sim_score in top_similar_users.items():
            # Skip if similarity is 0
            if sim_score <= 0: continue
            
            # Products this similar user bought
            user_purchases = user_item_matrix.loc[sim_user_id]
            bought_products = user_purchases[user_purchases > 0].index
            
            for pid in bought_products:
                if pid not in target_purchases:
                    if pid not in recommended_scores:
                        recommended_scores[pid] = 0
                    recommended_scores[pid] += sim_score
                    
        # Sort products by score
        rec_list = sorted(recommended_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Return top 5
        final_recs = [int(item[0]) for item in rec_list[:5]]
        
        # If we couldn't find enough recommendations through CF, pad with popular items
        if len(final_recs) < 5:
            top_products = df['ProductID'].value_counts().index.tolist()
            for pid in top_products:
                pid = int(pid)
                if pid not in target_purchases and pid not in final_recs:
                    final_recs.append(pid)
                if len(final_recs) >= 5:
                    break
        
        print(json.dumps(final_recs))
        
    except Exception as e:
        # Failsafe
        import traceback
        print(json.dumps([]), flush=True)
        traceback.print_exc(file=sys.stderr)
