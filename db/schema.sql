-- =====================================================================
-- SBU Dining System — PostgreSQL DDL
-- =====================================================================

DROP TABLE IF EXISTS Review CASCADE;
DROP TABLE IF EXISTS TransactionItem CASCADE;
DROP TABLE IF EXISTS DiningTransaction CASCADE;
DROP TABLE IF EXISTS DailyMenu CASCADE;
DROP TABLE IF EXISTS ItemAllergen CASCADE;
DROP TABLE IF EXISTS Allergen CASCADE;
DROP TABLE IF EXISTS MenuItem CASCADE;
DROP TABLE IF EXISTS Station CASCADE;
DROP TABLE IF EXISTS Employee CASCADE;
DROP TABLE IF EXISTS Student CASCADE;
DROP TABLE IF EXISTS DiningHall CASCADE;
DROP TABLE IF EXISTS MealPlan CASCADE;

-- 1. MealPlan
CREATE TABLE MealPlan (
    plan_id              INTEGER       PRIMARY KEY,
    plan_name            VARCHAR(50)   NOT NULL UNIQUE,
    price                DECIMAL(8,2)  NOT NULL CHECK (price >= 0),
    meal_swipes_per_week INTEGER       NOT NULL CHECK (meal_swipes_per_week >= 0),
    dining_dollars       DECIMAL(8,2)  NOT NULL DEFAULT 0 CHECK (dining_dollars >= 0),
    semester             VARCHAR(20)   NOT NULL
);

-- 2. DiningHall
CREATE TABLE DiningHall (
    hall_id        INTEGER       PRIMARY KEY,
    hall_name      VARCHAR(100)  NOT NULL UNIQUE,
    location       VARCHAR(100)  NOT NULL,
    capacity       INTEGER       CHECK (capacity > 0),
    opening_time   TIME,
    closing_time   TIME
);

-- 3. Student
CREATE TABLE Student (
    student_id              INTEGER       PRIMARY KEY,
    sbu_id                  VARCHAR(9)    NOT NULL UNIQUE,
    first_name              VARCHAR(50)   NOT NULL,
    last_name               VARCHAR(50)   NOT NULL,
    email                   VARCHAR(100)  NOT NULL UNIQUE,
    class_year              VARCHAR(20)   NOT NULL
                              CHECK (class_year IN ('Freshman','Sophomore','Junior','Senior','Graduate')),
    major                   VARCHAR(100),
    plan_id                 INTEGER,
    wolfie_wallet_balance   DECIMAL(8,2)  NOT NULL DEFAULT 0
                              CHECK (wolfie_wallet_balance >= 0),
    FOREIGN KEY (plan_id) REFERENCES MealPlan(plan_id)
);

-- 4. Employee (self-referencing supervisor_id)
CREATE TABLE Employee (
    employee_id    INTEGER       PRIMARY KEY,
    first_name     VARCHAR(50)   NOT NULL,
    last_name      VARCHAR(50)   NOT NULL,
    role           VARCHAR(50)   NOT NULL
                     CHECK (role IN ('Manager','Supervisor','Cashier','Cook','Server','Dishwasher')),
    hall_id        INTEGER,
    hire_date      DATE          NOT NULL,
    supervisor_id  INTEGER,
    hourly_wage    DECIMAL(6,2)  NOT NULL CHECK (hourly_wage > 0),
    FOREIGN KEY (hall_id)       REFERENCES DiningHall(hall_id),
    FOREIGN KEY (supervisor_id) REFERENCES Employee(employee_id)
);

-- 5. Station
CREATE TABLE Station (
    station_id     INTEGER       PRIMARY KEY,
    hall_id        INTEGER       NOT NULL,
    station_name   VARCHAR(100)  NOT NULL,
    cuisine_type   VARCHAR(50),
    FOREIGN KEY (hall_id) REFERENCES DiningHall(hall_id)
);

-- 6. MenuItem (booleans use DEFAULT FALSE for PostgreSQL)
CREATE TABLE MenuItem (
    item_id          INTEGER       PRIMARY KEY,
    item_name        VARCHAR(100)  NOT NULL,
    category         VARCHAR(50)   NOT NULL
                       CHECK (category IN ('Entree','Side','Dessert','Beverage','Appetizer','Soup','Salad')),
    calories         INTEGER       CHECK (calories >= 0),
    price            DECIMAL(6,2)  NOT NULL CHECK (price >= 0),
    is_vegetarian    BOOLEAN       NOT NULL DEFAULT FALSE,
    is_vegan         BOOLEAN       NOT NULL DEFAULT FALSE,
    is_gluten_free   BOOLEAN       NOT NULL DEFAULT FALSE
);

-- 7. Allergen
CREATE TABLE Allergen (
    allergen_id     INTEGER      PRIMARY KEY,
    allergen_name   VARCHAR(50)  NOT NULL UNIQUE
);

-- 8. ItemAllergen (M:N junction)
CREATE TABLE ItemAllergen (
    item_id      INTEGER NOT NULL,
    allergen_id  INTEGER NOT NULL,
    PRIMARY KEY (item_id, allergen_id),
    FOREIGN KEY (item_id)     REFERENCES MenuItem(item_id) ON DELETE CASCADE,
    FOREIGN KEY (allergen_id) REFERENCES Allergen(allergen_id) ON DELETE CASCADE
);

-- 9. DailyMenu
CREATE TABLE DailyMenu (
    menu_id       INTEGER     PRIMARY KEY,
    station_id    INTEGER     NOT NULL,
    item_id       INTEGER     NOT NULL,
    serve_date    DATE        NOT NULL,
    meal_period   VARCHAR(20) NOT NULL
                    CHECK (meal_period IN ('Breakfast','Lunch','Dinner','Late Night')),
    UNIQUE (station_id, item_id, serve_date, meal_period),
    FOREIGN KEY (station_id) REFERENCES Station(station_id),
    FOREIGN KEY (item_id)    REFERENCES MenuItem(item_id)
);

-- 10. DiningTransaction
CREATE TABLE DiningTransaction (
    transaction_id     INTEGER       PRIMARY KEY,
    student_id         INTEGER       NOT NULL,
    hall_id            INTEGER       NOT NULL,
    employee_id        INTEGER,
    amount             DECIMAL(8,2)  NOT NULL CHECK (amount >= 0),
    payment_method     VARCHAR(20)   NOT NULL
                         CHECK (payment_method IN
                                ('Meal Swipe','Dining Dollars','Wolfie Wallet','Credit Card','Cash')),
    transaction_time   TIMESTAMP     NOT NULL,
    FOREIGN KEY (student_id)  REFERENCES Student(student_id),
    FOREIGN KEY (hall_id)     REFERENCES DiningHall(hall_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

-- 11. TransactionItem (M:N junction)
CREATE TABLE TransactionItem (
    transaction_id   INTEGER       NOT NULL,
    item_id          INTEGER       NOT NULL,
    quantity         INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
    item_price       DECIMAL(6,2)  NOT NULL CHECK (item_price >= 0),
    PRIMARY KEY (transaction_id, item_id),
    FOREIGN KEY (transaction_id) REFERENCES DiningTransaction(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id)        REFERENCES MenuItem(item_id)
);

-- 12. Review
CREATE TABLE Review (
    review_id     INTEGER  PRIMARY KEY,
    student_id    INTEGER  NOT NULL,
    hall_id       INTEGER,
    item_id       INTEGER,
    rating        INTEGER  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text   TEXT,
    review_date   DATE     NOT NULL,
    CHECK (hall_id IS NOT NULL OR item_id IS NOT NULL),
    FOREIGN KEY (student_id) REFERENCES Student(student_id),
    FOREIGN KEY (hall_id)    REFERENCES DiningHall(hall_id),
    FOREIGN KEY (item_id)    REFERENCES MenuItem(item_id)
);
