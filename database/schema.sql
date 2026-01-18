-- Tool Share Database Schema
-- SQL Server / Azure SQL

-- Users table
CREATE TABLE dbo.Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    externalId NVARCHAR(255) NOT NULL UNIQUE, -- Azure AD B2C object ID
    displayName NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    phone NVARCHAR(20) NULL,
    avatarUrl NVARCHAR(500) NULL,
    bio NVARCHAR(500) NULL,
    streetAddress NVARCHAR(200) NULL,
    city NVARCHAR(100) NULL,
    state NVARCHAR(50) NULL,
    zipCode NVARCHAR(20) NULL,
    reputationScore DECIMAL(3,2) DEFAULT 0,
    notifyEmail BIT DEFAULT 1,
    stripeCustomerId NVARCHAR(255) NULL,
    subscriptionStatus NVARCHAR(20) DEFAULT 'trial', -- trial, active, past_due, cancelled
    subscriptionEndsAt DATETIME2 NULL,
    tosAcceptedAt DATETIME2 NULL,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NULL
);

CREATE INDEX IX_Users_externalId ON dbo.Users(externalId);
CREATE INDEX IX_Users_email ON dbo.Users(email);
CREATE INDEX IX_Users_stripeCustomerId ON dbo.Users(stripeCustomerId);

-- Circles table
CREATE TABLE dbo.Circles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500) NULL,
    inviteCode NVARCHAR(20) NOT NULL UNIQUE,
    isPublic BIT DEFAULT 0,
    createdBy UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Users(id),
    createdAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_Circles_inviteCode ON dbo.Circles(inviteCode);
CREATE INDEX IX_Circles_createdBy ON dbo.Circles(createdBy);

-- Circle Members table
CREATE TABLE dbo.CircleMembers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    circleId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Circles(id) ON DELETE CASCADE,
    userId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Users(id) ON DELETE CASCADE,
    role NVARCHAR(20) NOT NULL DEFAULT 'member', -- member, admin, owner
    joinedAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_CircleMembers_CircleUser UNIQUE (circleId, userId)
);

CREATE INDEX IX_CircleMembers_circleId ON dbo.CircleMembers(circleId);
CREATE INDEX IX_CircleMembers_userId ON dbo.CircleMembers(userId);

-- Tools table
CREATE TABLE dbo.Tools (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ownerId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Users(id),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(1000) NULL,
    category NVARCHAR(50) NOT NULL,
    brand NVARCHAR(100) NULL,
    model NVARCHAR(100) NULL,
    upc NVARCHAR(50) NULL,
    status NVARCHAR(20) DEFAULT 'available', -- available, unavailable, archived
    advanceNoticeDays INT DEFAULT 1,
    maxLoanDays INT DEFAULT 7,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NULL
);

CREATE INDEX IX_Tools_ownerId ON dbo.Tools(ownerId);
CREATE INDEX IX_Tools_category ON dbo.Tools(category);
CREATE INDEX IX_Tools_status ON dbo.Tools(status);

-- Tool Photos table
CREATE TABLE dbo.ToolPhotos (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    toolId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Tools(id) ON DELETE CASCADE,
    url NVARCHAR(500) NOT NULL,
    isPrimary BIT DEFAULT 0,
    uploadedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_ToolPhotos_toolId ON dbo.ToolPhotos(toolId);

-- Tool Circles (many-to-many)
CREATE TABLE dbo.ToolCircles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    toolId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Tools(id) ON DELETE CASCADE,
    circleId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Circles(id) ON DELETE CASCADE,
    CONSTRAINT UQ_ToolCircles_ToolCircle UNIQUE (toolId, circleId)
);

CREATE INDEX IX_ToolCircles_toolId ON dbo.ToolCircles(toolId);
CREATE INDEX IX_ToolCircles_circleId ON dbo.ToolCircles(circleId);

-- Reservations table
CREATE TABLE dbo.Reservations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    toolId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Tools(id),
    borrowerId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Users(id),
    status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirmed, active, completed, cancelled, declined
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    note NVARCHAR(500) NULL,
    ownerNote NVARCHAR(500) NULL,
    pickupConfirmedAt DATETIME2 NULL,
    returnConfirmedAt DATETIME2 NULL,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NULL,
    CONSTRAINT CK_Reservations_Dates CHECK (endDate >= startDate)
);

CREATE INDEX IX_Reservations_toolId ON dbo.Reservations(toolId);
CREATE INDEX IX_Reservations_borrowerId ON dbo.Reservations(borrowerId);
CREATE INDEX IX_Reservations_status ON dbo.Reservations(status);
CREATE INDEX IX_Reservations_dates ON dbo.Reservations(startDate, endDate);

-- Loan Photos (before/after)
CREATE TABLE dbo.LoanPhotos (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    reservationId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Reservations(id) ON DELETE CASCADE,
    type NVARCHAR(20) NOT NULL, -- before, after
    url NVARCHAR(500) NOT NULL,
    uploadedBy UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Users(id),
    notes NVARCHAR(500) NULL,
    uploadedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_LoanPhotos_reservationId ON dbo.LoanPhotos(reservationId);

-- Reviews table
CREATE TABLE dbo.Reviews (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    reservationId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Reservations(id),
    reviewerId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Users(id),
    revieweeId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Users(id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment NVARCHAR(1000) NULL,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Reviews_ReservationReviewer UNIQUE (reservationId, reviewerId)
);

CREATE INDEX IX_Reviews_reservationId ON dbo.Reviews(reservationId);
CREATE INDEX IX_Reviews_revieweeId ON dbo.Reviews(revieweeId);

-- Notifications table
CREATE TABLE dbo.Notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    userId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Users(id) ON DELETE CASCADE,
    type NVARCHAR(50) NOT NULL,
    title NVARCHAR(200) NOT NULL,
    message NVARCHAR(1000) NOT NULL,
    relatedId UNIQUEIDENTIFIER NULL,
    isRead BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_Notifications_userId ON dbo.Notifications(userId);
CREATE INDEX IX_Notifications_isRead ON dbo.Notifications(userId, isRead);
