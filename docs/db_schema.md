### 1. High-Level Architecture

The database follows a normalized **Relational Database** model hosted on PostgreSQL (via Supabase). The design creates a clear separation of concerns using three distinct logical zones:

1. **Identity Zone (Left):** Handles authentication and user profiles.
2. **Container Zone (Center):** Groups user data into logical collections (Portfolios and Watchlists).
3. **Data & Reference Zone (Right):** Stores the actual holdings and the shared cache of stock market metadata.

### 2. Table-by-Table Dictionary

#### **User Identity & Management**

* **`auth.users`**:
* **Purpose:** Managed internally by Supabase. This handles secure login, password encryption, and JWT token generation.
* **Key Field:** `id` (UUID) - The primary key used to identify a logged-in user.


* **`public.profiles`**:
* **Purpose:** Stores application-specific user data that needs to be publicly accessible or editable by the user (unlike `auth.users` which is protected).
* **Relationship:** **One-to-One** with `auth.users`. When a new user signs up, a trigger automatically creates a matching row here.
* **Key Fields:** `username` (for display).



#### **Data Containers**

* **`public.portfolios`**:
* **Purpose:** Acts as a folder for a user's holdings. A user can create multiple portfolios (e.g., "Retirement", "Day Trading") to segregate their assets.
* **Relationship:** **One-to-Many** (One User  Many Portfolios).


* **`public.watchlists`**:
* **Purpose:** Similar to portfolios, but tracks stocks the user is interested in but does not necessarily own.



#### **Market Data (The Reference Layer)**

* **`public.stocks`**:
* **Purpose:** A central "Master Table" that acts as a cache for stock metadata. Instead of querying the Yahoo Finance API every time a user loads their dashboard, we store static data (Sector, Industry, Name) here.
* **Why it's critical:** This table enables the **Sector Distribution Pie Chart**. Without this table, calculating sector diversity would require hundreds of slow API calls.
* **Key Fields:** `ticker` (Primary Key), `sector` (Used for grouping/filtering charts).



#### **Junction Tables (The Connectors)**

* **`public.portfolio_items`**:
* **Purpose:** Connects a **Portfolio** to a **Stock**. This represents the actual "ownership" event.
* **Key Fields:**
* `quantity`: How many shares are owned.
* `buy_price`: Used to calculate cost-basis and total portfolio value.




* **`public.watchlist_items`**:
* **Purpose:** Connects a **Watchlist** to a **Stock**. Tracks interest without ownership data (no price/quantity needed).



---