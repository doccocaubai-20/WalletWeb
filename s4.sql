INSERT INTO transaction_types (TypeID, TypeName, Description) VALUES 
(1, 'TRANSFER', 'Chuyển tiền giữa các ví'),
(2, 'DEPOSIT', 'Nạp tiền từ ngân hàng'),
(3, 'WITHDRAW', 'Rút tiền về ngân hàng'),
(4, 'PAYMENT', 'Thanh toán dịch vụ/hóa đơn');

INSERT INTO people (PeopleID, FullName, IDCard, DateOfBirth, Email, PhoneNumber, Address) VALUES 
(2, 'Trần Thị Thu Cúc', '038205001234', '2004-05-15', 'thucuc@gmail.com', '0333444555', 'Hà Nội');

INSERT INTO useraccount (UserID, Username, Password, Role, Status, CreatedAt, PeopleID) VALUES 
(2, 'tranthib', '123456', 'CUSTOMER', 'ACTIVE', '2026-03-07 16:00:00', 2);

-- Cập nhật User 1 (nguyenvana) để có số dư 2 triệu và STK giống trong UI
UPDATE account 
SET AccountNumber = '2099782378', 
    Balance = 2000000.00, 
    PIN = '123456' 
WHERE AccID = 1;

-- Thêm ví cho User 2 làm người nhận (Khớp với STK 0987654321 trong UI)
INSERT INTO account (AccID, AccountNumber, Balance, Currency, Status, OpenDate, UserID, Version, PIN) VALUES 
(2, '0987654321', 50000.00, 'VND', 'OPEN', NOW(), 2, 0, '123456');

INSERT INTO transaction_types (TypeID, TypeName, Description) VALUES 
(1, 'TRANSFER', 'Chuyển tiền giữa các ví'),
(2, 'DEPOSIT', 'Nạp tiền từ ngân hàng'),
(3, 'WITHDRAW', 'Rút tiền về ngân hàng'),
(4, 'PAYMENT', 'Thanh toán dịch vụ/hóa đơn');

-- Dòng 1: Log cho người gửi (Ví 1 bị trừ tiền)
INSERT INTO transactions (AccountID, Amount, BalanceAfter, TransactionCode, RelatedParty, TransTypeID, Description, Status) VALUES 
(1, -50000.00, 1950000.00, 'NP171000001', '0987654321', 1, 'Chuyển tiền ăn trưa', 'SUCCESS');

-- Dòng 2: Log cho người nhận (Ví 2 được cộng tiền)
INSERT INTO transactions (AccountID, Amount, BalanceAfter, TransactionCode, RelatedParty, TransTypeID, Description, Status) VALUES 
(2, 50000.00, 100000.00, 'NP171000001', '2099782378', 1, 'Chuyển tiền ăn trưa', 'SUCCESS');