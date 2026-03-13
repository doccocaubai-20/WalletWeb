CREATE DATABASE IF NOT EXISTS EWalletDB;
USE EWalletDB;

CREATE TABLE People (
    PeopleID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    IDCard VARCHAR(20) UNIQUE NOT NULL, 
    DateOfBirth DATE,
    Email VARCHAR(100),
    PhoneNumber VARCHAR(15),
    Address VARCHAR(255)
);

CREATE TABLE UserAccount (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL, -- 'CUSTOMER', 'ADMIN'
    Status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'LOCKED', 'BANNED'
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PeopleID INT UNIQUE NOT NULL, 
    FOREIGN KEY (PeopleID) REFERENCES People(PeopleID)
);

-- =============================================
-- MODULE 2: BANKING BUSINESS (NGHIỆP VỤ NGÂN HÀNG)
-- =============================================

CREATE TABLE Employee (
    EmpID INT AUTO_INCREMENT PRIMARY KEY,
    Position VARCHAR(50), 
    Salary DECIMAL(18, 2), 
    StartDate DATE,
    PeopleID INT UNIQUE NOT NULL,
    FOREIGN KEY (PeopleID) REFERENCES People(PeopleID)
);

CREATE TABLE Customer (
    CustID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerType VARCHAR(50),
    JoinDate DATE DEFAULT (CURRENT_DATE),
    PeopleID INT UNIQUE NOT NULL,
    FOREIGN KEY (PeopleID) REFERENCES People(PeopleID)
);

CREATE TABLE Account (
    AccID INT AUTO_INCREMENT PRIMARY KEY,
    AccountNumber VARCHAR(20) UNIQUE NOT NULL, 
    Balance DECIMAL(18, 2) DEFAULT 0, 
    Currency VARCHAR(5) DEFAULT 'VND',
    Status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CLOSED, FROZEN
    OpenDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    UserID INT NOT NULL, 
    FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);

-- =============================================
-- MODULE 3: TRANSACTION (GIAO DỊCH & SAO KÊ)
-- =============================================

CREATE TABLE TransactionType (
    TransTypeID INT PRIMARY KEY,
    TypeName VARCHAR(50) NOT NULL
);

CREATE TABLE Transactions (
    TransID INT AUTO_INCREMENT PRIMARY KEY,
    TransTypeID INT NOT NULL,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT NOT NULL,
    Status VARCHAR(20) NOT NULL,
    Description VARCHAR(255),
    FOREIGN KEY (CreatedBy) REFERENCES UserAccount(UserID),
    FOREIGN KEY (TransTypeID) REFERENCES TransactionType(TransTypeID)
);

CREATE TABLE TransactionDetail (
    DetailID INT AUTO_INCREMENT PRIMARY KEY,
    TransID INT NOT NULL,
    AccID INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    BalanceAfter DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (TransID) REFERENCES Transactions(TransID),
    FOREIGN KEY (AccID) REFERENCES Account(AccID)
);

use EWalletDB;

-- 1. Thêm Version chống lỗi trừ tiền sai và thêm mã PIN giao dịch
ALTER TABLE Account 
ADD COLUMN Version INT DEFAULT 0,
ADD COLUMN TransactionPin VARCHAR(255);

-- 2. Đưa thẳng thông tin gửi, nhận, số tiền vào bảng Transactions
ALTER TABLE Transactions 
ADD COLUMN SenderAccID INT NULL, 
ADD COLUMN ReceiverAccID INT NULL,
ADD COLUMN Amount DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN Fee DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD CONSTRAINT FK_Trans_Sender FOREIGN KEY (SenderAccID) REFERENCES Account(AccID),
ADD CONSTRAINT FK_Trans_Receiver FOREIGN KEY (ReceiverAccID) REFERENCES Account(AccID);

-- 3. Xóa bảng TransactionDetail dư thừa
DROP TABLE IF EXISTS TransactionType;account
-- Xóa bảng cũ không còn sử dụng
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Employee;

-- Cập nhật UserAccount (Chỉ dùng để đăng nhập và phân quyền)
CREATE TABLE UserAccount (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL -- Khai báo trực tiếp ADMIN hoặc CUSTOMER
);

-- Tạo bảng People (Lưu thông tin định danh)
CREATE TABLE People (
    PeopleID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT UNIQUE NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    IdentityNumber VARCHAR(20) UNIQUE, -- Số CCCD
    PhoneNumber VARCHAR(15) UNIQUE,
    Email VARCHAR(100) UNIQUE,
    FOREIGN KEY (UserID) REFERENCES UserAccount(UserID) ON DELETE CASCADE
);

DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
    TransID INT AUTO_INCREMENT PRIMARY KEY,
    AccountID INT NOT NULL,
    Amount DECIMAL(15, 2) NOT NULL,
    BalanceAfter DECIMAL(15, 2) NOT NULL,
    TransactionCode VARCHAR(50) NOT NULL,
    RelatedParty VARCHAR(100),
    TransTypeID INT, -- Khóa ngoại liên kết bảng transaction_types
    Description VARCHAR(255),
    Status VARCHAR(50) DEFAULT 'SUCCESS',
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_trans_account FOREIGN KEY (AccountID) REFERENCES account(accID),
    CONSTRAINT fk_trans_type FOREIGN KEY (TransTypeID) REFERENCES transaction_types(TypeID)
);
-- Tạo Index cho AccountID và TransactionCode để truy vấn lịch sử cực nhanh
CREATE INDEX idx_account_id ON transactions(AccountID);
CREATE INDEX idx_trans_code ON transactions(TransactionCode);

CREATE TABLE transaction_types (
    TypeID INT PRIMARY KEY,
    TypeName VARCHAR(50) NOT NULL, -- TRANSFER, DEPOSIT, WITHDRAW, PAYMENT...
    Description VARCHAR(255)
);