CREATE TABLE [dbo].[Users]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [externalId] NVARCHAR(255) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [phone] NVARCHAR(20) NULL,
    [avatarUrl] NVARCHAR(500) NULL,
    [bio] NVARCHAR(500) NULL,
    [streetAddress] NVARCHAR(200) NULL,
    [city] NVARCHAR(100) NULL,
    [state] NVARCHAR(50) NULL,
    [zipCode] NVARCHAR(20) NULL,
    [reputationScore] DECIMAL(3,2) DEFAULT 0,
    [notifyEmail] BIT DEFAULT 1,
    [stripeCustomerId] NVARCHAR(255) NULL,
    [subscriptionStatus] NVARCHAR(20) DEFAULT 'trial',
    [subscriptionEndsAt] DATETIME2 NULL,
    [tosAcceptedAt] DATETIME2 NULL,
    [createdAt] DATETIME2 DEFAULT GETUTCDATE(),
    [updatedAt] DATETIME2 NULL,
    CONSTRAINT [UQ_Users_externalId] UNIQUE ([externalId]),
    CONSTRAINT [UQ_Users_email] UNIQUE ([email])
);
GO

CREATE INDEX [IX_Users_externalId] ON [dbo].[Users]([externalId]);
GO

CREATE INDEX [IX_Users_email] ON [dbo].[Users]([email]);
GO

CREATE INDEX [IX_Users_stripeCustomerId] ON [dbo].[Users]([stripeCustomerId]);
GO
