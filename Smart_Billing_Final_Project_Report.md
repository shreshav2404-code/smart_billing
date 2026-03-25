# PROJECT REPORT

## SMART BILLING SYSTEM WITH RECOMMENDATION USING APRIORI ALGORITHM

---

### 1. TITLE PAGE

**Project Title:** Smart Billing System with Recommendation using Apriori Algorithm  
**Author:** Keshav Jha  
**Course/Degree:** Final Year Engineering Project  
**Date:** March 2026  
**Core Technologies:** React.js, Node.js, Express, SQLite, Python, Machine Learning (Apriori & Collaborative Filtering)

---

### 2. ABSTRACT

Traditional retail billing systems are often characterized by manual item entry, slow processing times, and a complete lack of intelligent business insights. The **Smart Billing System with Recommendation using Apriori Algorithm** is an advanced full-stack web application designed to revolutionize the retail checkout experience. By integrating a dynamic React.js frontend with a robust Node.js backend and a Python-powered Machine Learning engine, this system not only automates billing and inventory management but also actively increases sales through predictive product recommendations.

The core intelligence of the system lies in its Machine Learning modules. It utilizes the **Apriori Algorithm** to analyze the database of historical transactions and discover frequent itemsets, enabling real-time "Frequently Bought Together" suggestions during checkout. Additionally, a **User-Based Collaborative Filtering** system powered by Cosine Similarity provides personalized product recommendations based on individual purchase history. The system ensures robust security through JWT-based role authentication, and introduces an innovative, zero-contact verification method using dynamically generated QR codes and cryptographic OTPs. This project effectively bridges the gap between conventional point-of-sale systems and modern data science.

---

### 3. ACKNOWLEDGEMENT

I would like to express my profound gratitude to all the individuals who provided invaluable guidance and support throughout the development of this project. My sincere thanks to the project mentors and faculty members for their continuous encouragement and critical feedback, which shaped the architecture and implementation of this system. I am also thankful to the open-source community for providing comprehensive documentations and robust libraries that made the complex Machine Learning integrations possible. Finally, I extend my appreciation to my peers for their assistance during the beta testing and evaluation phases.

---

### 4. TABLE OF CONTENTS

1.  Title Page
2.  Abstract
3.  Acknowledgement
4.  Table of Contents
5.  Introduction
    *   Problem Statement
    *   Objectives
    *   Scope of the Project
6.  Literature Survey
    *   Existing Systems
    *   Limitations
    *   Proposed System Advantages
7.  System Overview
    *   Complete Working Explanation
    *   Use Case Description
8.  System Architecture
    *   High-level Architecture Explanation
    *   Architecture Diagram
9.  Technology Stack
    *   Frontend, Backend, Database
10. Module-wise Explanation
    *   Billing, Products, ML, Auth, History
11. Database Design
    *   Tables, Indexes, Sample Data
12. Algorithm Section
    *   Apriori Math & Numerical Example
    *   Collaborative Filtering & Pseudocodes
13. Working Flow
    *   Step-by-Step Execution
14. Code Explanation
    *   Complete File-by-File Breakdown
    *   Full API Route Definitions
15. UI/UX Explanation
    *   Screens & Interaction Flow
16. Results and Outputs
17. Testing
    *   Expanded Test Cases Table
18. Advantages
19. Limitations
20. Future Enhancements
21. Conclusion
22. References

---

### 5. INTRODUCTION

#### Problem Statement
In the fast-paced retail industry, traditional POS (Point of Sale) and billing systems act merely as calculators and receipt generators. They require manual barcode scanning, causing long customer queues. More importantly, these systems do not leverage historical sales data to provide cross-selling opportunities to store owners. Small-to-medium retail shops lose significant revenue by failing to recommend relevant products contextually to customers at the time of purchase.

#### Objectives
1.  **Automated Cart & Checkout:** Provide a digital interface for customers to select items and proceed to checkout seamlessly without manual intervention.
2.  **Intelligent Cross-Selling:** Implement the Apriori association rule mining algorithm to dynamically suggest products based on current cart contents.
3.  **Personalization:** Deploy Collaborative Filtering to suggest products based on user purchasing behavior.
4.  **Secure Exit Verification:** Generate an OTP and QR code upon purchase completion to be verified by a gatekeeper.
5.  **Administrative Analytics:** Provide store owners with a visual dashboard of KPIs, revenue trends, and inventory levels.

#### Scope of the Project
The project is built specifically for supermarkets, pharmacies, electronic shops, and general retail businesses. It covers user management, automated stock deduction, offline-first SQLite data storage, and the execution of external Python scripts for data mining.

---

### 6. LITERATURE SURVEY

#### Existing Systems
Contemporary billing environments typically utilize legacy software (e.g., Tally POS, standard ERPs) that are strictly transactional. Customers bring physical items to a cashier who scans them sequentially. Modern e-commerce sites (like Amazon) have recommendation engines, but these are rarely integrated into physical retail or localized smart billing systems.

#### Limitations
1.  **Lack of Intelligence:** They cannot analyze data mathematically to find hidden item associations (e.g., Bread -> Butter).
2.  **Hardware Dependency:** Heavy reliance on specific physical barcode scanners and receipt printers.
3.  **No Customer Personalization:** They treat all customers identically, with no memory of past preferences.

#### Proposed System Advantages
1.  **Predictive Analytics:** Implements state-of-the-art Apriori algorithm to boost cart value right before payment.
2.  **Hardware Agnostic:** Web-based interface works on iPads, smartphones, and desktop computers.
3.  **Dual Verification:** Secures inventory by issuing an encrypted QR code and 6-digit OTP to prevent theft.
4.  **Actionable Owner Insights:** The owner dashboard turns raw database rows into visual, actionable business intelligence graphs.

---

### 7. SYSTEM OVERVIEW

#### Complete Working Explanation
The Smart Billing System is a distributed application. Users interact with a React application to browse categories and add items to a digital cart. The moment an item enters the cart, the system triggers the backend, which spawns a Python Child Process. This Python script fetches thousands of historical orders from the SQLite database, performs Association Rule Mining (Apriori), and returns the associated products. The React frontend then displays "You might also like...".

Once the customer finalizes the cart, a secure transaction is committed to the database using SQL Transactions (`BEGIN`, `COMMIT`, `ROLLBACK`), ensuring stock levels never go below zero. A 6-digit cryptographic OTP and a JSON-embedded QR Code are generated and shown on the screen. At the exit gate, the security guard uses the `QRVerify` module (which utilizes the device camera via `html5-qrcode`) to scan the QR code and instantly validate if the order is paid.

#### Use Case Description
*   **Actor: Customer:** Can Register/Login, view products, edit the cart, receive ML suggestions, and checkout.
*   **Actor: Shop Owner:** Can add/edit/delete product inventory, adjust ML parameters dynamically, and view revenue charts.
*   **Actor: Gatekeeper:** Uses the Verification Screen to scan QR codes or type OTPs to validate exits.

---

### 8. SYSTEM ARCHITECTURE

#### High-level Architecture Explanation
The architecture relies on an asynchronous **Client-Server Model** combined with a **Micro-Service Pattern** for Machine Learning. React.js manages the View and local states. Node.js/Express.js acts as the central Controller, exposing RESTful APIs. When Python-intensive mathematical tasks are required, Node.js uses `child_process.spawn` to delegate the task, ensuring the main JavaScript Event Loop is never blocked.

#### Architecture Diagram (ASCII)

```text
  [ Client Devices ]
   (React.js UI)
   + Mobile QR Scanner
   + Desktop Dashboard
          |
  Axios REST API Calls (JSON / JWT Auth)
          |
          V
+-------------------------------------------------------+
|                NODE.JS & EXPRESS BACKEND              |
|                                                       |
|  [ Auth Router ]      [ Order Router ]                |
|  [ Product Router ]   [ Analytics Router ]            |
|                                                       |
|        +-----------------------------------+          |
|        |     Child Process Handler         |          |
|        | (spawn: python recommend.py)      |          |
|        | (spawn: python collaborative.py)  |          |
|        +-----------------------------------+          |
+-------------------------------------------------------+
          |                        |
     SQL Queries              JSON IPC
          |                        |
          V                        V
+-------------------+    +------------------------------+
|                   |    |      PYTHON ML ENGINE        |
|  SQLite Database  |    |  +------------------------+  |
| (smart_retail.db) |    |  | pandas (DataFrames)    |  |
|  (Products, Users |===>|  | mlxtend (Apriori)      |  |
|  Orders, Payments)|    |  | numpy (Cosine Sim.)    |  |
|                   |    |  +------------------------+  |
+-------------------+    +------------------------------+
```

---

### 9. TECHNOLOGY STACK

#### Frontend
*   **Framework:** React 18 (Bootstrapped with Vite `vite.config.js` for instant HMR).
*   **State Management:** React Hooks (`useState`, `useEffect`).
*   **Routing:** `react-router-dom` v6.
*   **UI Libraries:** `recharts` for internal dashboard charting. Pure CSS in `App.css` (800+ lines defining gradients, animations, and responsive grids).
*   **Hardware Integration:** `html5-qrcode` for parsing physical QR data via webcams.

#### Backend
*   **Runtime:** Node.js.
*   **Framework:** Express.js 4.
*   **Authentication:** `jsonwebtoken` (JWT), `bcryptjs` for secure password hashing.
*   **Data Generation:** `qrcode` library to encode transaction payloads.
*   **IPC:** Node's native `child_process` module.

#### Database
*   **RDBMS:** SQLite3.
*   **Driver:** `sqlite3` npm package with asynchronous Promise wrappers.

#### Machine Learning Tools & Dependencies
*   **Language:** Python 3.
*   **Libraries:** `pandas` (tabular data manipulation), `mlxtend` (implementation of Association Algorithms like Apriori), `numpy` (linear algebra algorithms).

---

### 10. MODULE-WISE EXPLANATION

#### Authentication & Identity Module
Controls access to the system. Utilizes `bcryptjs` to hash all user passwords synchronously before DB insertion. Issues a signed JWT (JSON Web Token) containing `{ userId, role }` which the React state stores locally. Both Customers and Owners traverse this pipeline.

#### Billing & Transaction Module
Responsible for finalizing the cart. Uses strictly defined SQLite SQL Transactions to guarantee ACID compliance when deducing product stocks and writing to the Orders table. Simultaneously creates a `Payment` entity holding a cryptographically unique OTP string.

#### Product Database Module
A CRUD (Create, Read, Update, Delete) module protected by a `verifyOwner` Express middleware. It tracks live inventory levels and categorized meta-tags (Groceries, Sports, Beauty, Medical, Electrical).

#### Recommendation Engine
1.  **Cart Interface Module:** `CheckoutSuggestions.jsx` listens to changes in the active `[cart]` subset.
2.  **Apriori Engine (`recommend.py`):** Calculates rules based on global purchasing history for active cross-selling.
3.  **Collaborative Filter Engine (`collaborative.py`):** Calculates localized User-Item similarity matrices to suggest holistic homepage content.

#### Administrative Dashboard
Extracts raw SQLite row data using temporal aggregate functions (`SUM`, `COUNT`, `GROUP BY DATE`) and pipes JSON models into Recharts to dynamically render graphical Revenue and Category data. Allows live alteration of backend configuration limits (`ML_MIN_SUPPORT`).

#### Customer Analytics (Order History)
Permits authorized buyers to retrospectively examine their previous transactions securely, fostering transparency natively in the client ecosystem.

---

### 11. DATABASE DESIGN

#### Tables with Fields
1.  **Users:** `UserID` (PK), `Username`, `Email` (Unique), `Password` (Hashed), `Role` (customer/owner).
2.  **Products:** `ProductID` (PK), `Name`, `Price`, `Stock`, `Weight`, `Category`.
3.  **Orders:** `OrderID` (PK), `UserID` (FK), `TotalAmount`, `Status`, `CreatedAt`.
4.  **OrderItems:** `OrderItemID` (PK), `OrderID` (FK), `ProductID` (FK), `Quantity`, `Price`.
5.  **Payments:** `PaymentID` (PK), `OrderID` (FK), `Amount`, `Status`, `OTP`, `CreatedAt`.
6.  **Settings:** `Key` (PK), `Value` (Stores dynamic ML configurations).

#### Relationships & Indexes
*   **Relationships:**
    *   A **User** (1) can handle multiple **Orders** (N). (1:N)
    *   An **Order** (1) binds exactly to one **Payment** (1). (1:1)
    *   An **Order** (1) is assembled from multiple **OrderItems** (N). (1:N)
*   **Indexes:**
    Indexes heavily augment system readiness, minimizing `O(n)` scan sequences. Defined natively in `schema.sql`:
    `idx_email`, `idx_name`, `idx_user`, `idx_status`, `idx_order_items`, `idx_product_items`, and `idx_order_payments`.

#### Sample Data Implementation
The database initializes uniquely across **31 Core Products** spanning **5 Logical Categories**:
*   *Groceries:* Apple, Banana, Milk, Bread, Cheese, Eggs
*   *Sports:* Football, Cricket Bat, Tennis Ball, Badminton Racket, Running Shoes
*   *Beauty:* Face Wash, Moisturizer, Lipstick, Eyeliner, Perfume
*   *Medical:* Paracetamol, Cough Syrup, Band-Aid, Vitamin C, Antiseptic Cream
*   *Electrical:* Smartphone, Earphones, Power Bank, USB Cable, Smart Watch, LED Bulb

---

### 12. ALGORITHM SECTION (VERY IMPORTANT)

The pivotal aspect of this project is the **Machine Learning Recommendations** powered by mathematical algorithms.

#### 1. Apriori Algorithm (Cart-Based Cross-Selling)
Apriori operates on the "Downward Closure Property."
1.  **Candidate Generation:** Finds frequent itemsets exceeding a configured Support minimum.
2.  **Rule Generation:** Extrapolates conditional rules exceeding Confidence standards.

##### Numerical Mathematical Worked Example
Assume a store has 5 total historical transactions:
```text
T1 = {Milk, Bread}
T2 = {Milk, Eggs, Bread}
T3 = {Bread, Apple}
T4 = {Milk, Eggs}
T5 = {Milk, Eggs, Bread}
```
If a user puts `{Milk}` in cart. Will they buy `{Eggs}`?
*   **Support (Frequency):** `Freq({Milk, Eggs}) / N` = `3 / 5` = **0.60**
*   **Confidence (Reliability):** `Supp({Milk, Eggs}) / Supp({Milk})` = `0.60 / (4/5)` = **0.75** (75% chance)
*   **Lift (Correlation):** `Confidence / Supp({Eggs})` = `0.75 / (3/5)` = **1.25**  (`Lift > 1` implies strong positive mathematical linkage; thus Egg is recommended!)

#### 2. Collaborative Filtering (User-Based Personalization)
Uses computational linear algebra directly predicting user affinities.
1.  **Matrix Pivot:** Historical transactions are refactored into a sparse User-Item grid matrix (`U_rows`, `I_columns`).
2.  **Cosine Similarity:** Computes spatial vector angles.  
    `Similarity(A, B) = DotProduct(A,B) / (Norm(A) * Norm(B))`

##### Pseudocode - Collaborative Filtering
```text
Procedure UserCF(TargetUserID, InteractionMatrix):
    TopScores = []
    VectorA = GetRow(InteractionMatrix, TargetUserID)
    
    For each UserID B in InteractionMatrix:
        If B == TargetUserID: continue
        VectorB = GetRow(InteractionMatrix, B)
        Score = Numpy.Dot(VectorA, VectorB) / (Numpy.Norm(VectorA) * Numpy.Norm(VectorB))
        TopScores.append({User: B, Score: Score})
        
    TopUsers = SortDescending(TopScores, limit=5)
    SuggestedProducts = []
    
    For User in TopUsers:
        Items = GetUnseenItemsPurchasedBy(User, InteractionMatrix)
        SuggestedProducts.Union(Items weighted by User.Score)
        
    Return SuggestedProducts
```

---

### 13. WORKING FLOW

#### Step-by-step Execution
1.  **Onboarding:** Client loads React SPA (`index.html` -> `main.jsx` -> `App.jsx`). Registers via the `Login.jsx`/`Register.jsx` ecosystem.
2.  **Browse & Collaborative Recs:** `Products.jsx` map component iterations grids. Dispatches `GET /api/user-recommendations`, initializing Cosine Similarity mathematics internally to dictate top placement.
3.  **Active Shopping:** User places targeted SKU elements to global component Context via `cart` states.
4.  **Cart ML Inference:** UI dispatches `POST /api/checkout-recommendations` passing strict integers. Node.js invokes Python Child Processes (`spawn`).
5.  **Checkout Transmutation:** Client triggers the Payment action. Node explicitly writes SQL blocks.
6.  **Fulfillment Verification:** The gatekeeper utilizes `QRVerify.jsx` to natively scan the encoded DOM QR fragment validating payload authority across the backend `/api/verify-qr`.

---

### 14. CODE EXPLANATION

#### Frontend Architecture (`src/components/`)
*   **`main.jsx` & `App.jsx`:** The core Vite entrypoints that configure React Router and context providers.
*   **`Login.jsx` & `Register.jsx`:** Handles standard form bindings. Stores the received JWT into `localStorage`.
*   **`Products.jsx`:** Renders the core shopping grid, fetching `/api/products` and maintaining the local `cart` and `[recommendations]` state hierarchies.
*   **`Cart.jsx` & `Checkout.jsx`:** Manages item quantification, total aggregations, and final transaction triggers.
*   **`CheckoutSuggestions.jsx`:** Visually outputs dynamic algorithmic data strings indicating explicit correlation rules (Apriori).
*   **`OrderHistory.jsx`:** Secure profile interface extracting historical order artifacts exclusively bound to the JWT user payload.
*   **`OwnerDashboard.jsx`:** An isolated component requiring Role="owner". Feeds aggregation arrays strictly into Recharts visual frameworks.
*   **`QRVerify.jsx`:** Harnesses `html5-qrcode` interfacing browser APIs (webcam/video) strictly designed for POS Security terminals.

#### Configuration Files
*   **`vite.config.js`:** Build configurations bundling React apps iteratively.
*   **`App.css` & `index.css`:** Comprehensive global stylesheet encompassing linear-gradient backgrounds, fluid flexbox/grid containers, and structural DOM animations.

#### Backend Handlers (`backend/`)
*   **`server.js`:** The brain of the API. Crucial function includes `app.post('/api/checkout')` which ensures atomic DB transactions to prevent stock overselling (race conditions).
*   **`init.js` & `migrate.js`:** One-shot schema execution deploying SQL schema definitions globally.

#### Full API Blueprint
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Inserts new User, returns Auth Token | None |
| `POST` | `/api/auth/login` | Validates Bcrypt hashes | None |
| `GET` | `/api/products` | Yields comprehensive product stock | None |
| `GET` | `/api/orders` | Yields order data for the UserID | JWT |
| `POST` | `/api/checkout` | Validates cart, locks rows, processes orders | JWT / Guest |
| `POST` | `/api/checkout-recommendations` | Spawns Apriori engine passing Cartesian arrays | None |
| `GET` | `/api/user-recommendations` | Spawns Collaborative filtering engine relative to user | JWT |
| `POST` | `/api/verify-qr` | Interprets cryptographic Payment strings | None |
| `GET/PUT` | `/api/settings/ml` | Handles Python configuration parameters | Owner |
| `GET` | `/api/analytics` | Aggregates mass revenue data structures | Owner |

---

### 15. UI/UX EXPLANATION

Custom written styling spans via `App.css` (898 lines). Visual Logic embraces modern web paradigms: smooth CSS gradients (`linear-gradient`), transparent glassmorphism (`backdrop-filter`), and distinct UI animations (`@keyframes`).

#### Display Specifications
1.  **Authentication Screens:** Form elements are shadow-cast and dynamically sized, providing error boundaries instantly natively in the DOM.
2.  **Products List View (`Products.jsx`):** Renders item entities distinctly via CSS Maps. Immediately categorizes items. A dynamic banner displays Collaborative Filtering recs natively inline above generic stock.
3.  **Order History View (`OrderHistory.jsx`):** Presents tabular invoice rows clearly demarcating order values, dates, and strict transaction states.
4.  **Owner Dashboard (`OwnerDashboard.jsx`):** Emphasizes technical control. Integrates geometric standard charts rendering analytical intelligence flawlessly. Realtime slider manipulation visually updates configuration matrices.

---

### 16. RESULTS AND OUTPUTS

#### Sample Output Analysis
If a customer adds *Bread* (ID: 4) to their cart subset:
*   **System Input Request:** `Items: [4], minSupport: 0.05, minConfidence: 0.2`
*   **Apriori Output Pipeline:** The Python daemon calculates that historical clusters imply a strong affinity towards *Milk* and *Eggs*.
*   **Visual Delivery:** Node.js streams a mapped response dynamically rendering **Milk** to the user directly adjacent to the Checkout trigger button.

#### Administrative Effect
Because the transaction includes an unpredicted *Milk* purchase, the total cart evaluation intrinsically escalates, reflecting immediately in the numerical revenue graph managed in the `OwnerDashboard.jsx` analytics view.

---

### 17. TESTING

#### Exhaustive Test Cases List

| ID | Application Module | Description | Expected Event | Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Account/Registration | Register an existing distinct Email | HTTP 400 "User already exists" | Captured cleanly | **Pass** |
| **TC-02** | Account/Authentication | Guest Login procedure execution | Skips JWT, triggers dummy User | Authorized | **Pass** |
| **TC-03** | Core Checkout | Finalize item globally exceeding stock | SQL `ROLLBACK` executes, kills order | Aborted safely | **Pass** |
| **TC-04** | Apriori Engine | Forward empty cart integer subset | Python ignores data, returning `[]` | Failsafe Array | **Pass** |
| **TC-05** | Collaborative System | New user engages system | Algorithm falls back to generic Top Sellers | Recommended 5 items | **Pass** |
| **TC-06** | Role Infrastructure | Customer navigating to Dashboard | Backend MW yields HTTP 403 Forbidden | Access Blocked | **Pass** |
| **TC-07** | Order Accountability | Requesting Order History | Recalls data precisely matching JWT ID | Correct History | **Pass** |
| **TC-08** | Physical Validation | Manual input of corrupted QR String | Query evaluates falsy, flags red | Access Denied UI | **Pass** |

---

### 18. ADVANTAGES

1.  **Profitability Scaling:** Contextual cross-selling algorithms systematically construct higher average cart evaluations intrinsically.
2.  **Zero-Hardware Legacy Limits:** Fully network-agnostic web operation completely erodes dependencies on restrictive POS physical scanners.
3.  **Dynamic Algorithmic Constraints:** The owner manipulates Machine Learning behavior strictly through native UI sliders—zero coding demanded.
4.  **High-velocity Analytics:** Python pipelines calculate millions of structural combinations entirely asynchronous from the core javascript runtime loops.

---

### 19. LIMITATIONS

1.  **Data Scarcity (Cold Start Problem):** New deployments severely limit algorithmic confidence mappings. The system functionally requires substantive historical data thresholds prior to revealing intrinsic recommendations.
2.  **Execution File Locking:** Due strictly to SQLite core architecture, multi-tenant synchronous writes momentarily freeze database operations, potentially proving problematic during immense real-world bursts.

---

### 20. FUTURE ENHANCEMENTS

1.  **Direct Payment Integration:** Substituting simulation models dynamically with tangible financial operations like standard Stripe Elements or Razorpay gateways.
2.  **Relational Escalation:** Converting raw SQLite storage systems functionally to Postgres/MySQL, permitting profound database sharding paradigms.
3.  **Hardware Computer Vision Integration:** Connecting logical algorithms natively to store cameras explicitly to perform algorithmic object assessments independent of cashiers.
4.  **In-Memory Optimization:** Instantiating strict Redis cache layers globally reducing sequential Apriori compute cycles to sub-<10 millisecond intervals.

---

### 21. CONCLUSION

The **Smart Billing System with Recommendation using Apriori Algorithm** fundamentally intertwines modernized Javascript operational paradigms with rigorous computational data science mechanics. It unequivocally breaches the simplistic constraints governing traditional Point of Sale systems. Through synchronized implementations of Collaborative Filtering alongside rigorous Association Rule paradigms natively embedded within an architecturally secure client/server construct, the project delivers extensive quantitative sales value uniquely tailored to advanced commercial scalability strategies.

---

### 22. REFERENCES

1.  Agrawal, R., & Srikant, R. (1994). *Fast algorithms for mining association rules*. Proceedings of the 20th International Conference on Very Large Data Bases (VLDB), 487-499.
2.  Rasbt, S. (2018). *Association Rule Mining via Apriori.* MLxtend Library Documentation.
3.  Facebook Open Source. *React.js Dom Structure Methodologies*.
4.  OpenJS Foundation. *Node.js Asynchronous Child Process Architectures*.
5.  *NumPy Core Mathematical Documentation* (numpy.org).
