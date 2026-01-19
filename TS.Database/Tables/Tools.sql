CREATE TABLE [dbo].[Tools]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [ownerId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(1000) NULL,
    [category] NVARCHAR(50) NOT NULL,
    [brand] NVARCHAR(100) NULL,
    [model] NVARCHAR(100) NULL,
    [upc] NVARCHAR(50) NULL,
    [status] NVARCHAR(20) DEFAULT 'available',
    [advanceNoticeDays] INT DEFAULT 1,
    [maxLoanDays] INT DEFAULT 7,
    [createdAt] DATETIME2 DEFAULT GETUTCDATE(),
    [updatedAt] DATETIME2 NULL,
    CONSTRAINT [FK_Tools_Users] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[Users]([id])
);
GO

CREATE INDEX [IX_Tools_ownerId] ON [dbo].[Tools]([ownerId]);
GO

CREATE INDEX [IX_Tools_category] ON [dbo].[Tools]([category]);
GO

CREATE INDEX [IX_Tools_status] ON [dbo].[Tools]([status]);
GO
