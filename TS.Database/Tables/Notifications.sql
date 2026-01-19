CREATE TABLE [dbo].[Notifications]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [type] NVARCHAR(50) NOT NULL,
    [title] NVARCHAR(200) NOT NULL,
    [message] NVARCHAR(1000) NOT NULL,
    [relatedId] UNIQUEIDENTIFIER NULL,
    [isRead] BIT DEFAULT 0,
    [createdAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([userId]) REFERENCES [dbo].[Users]([id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Notifications_userId] ON [dbo].[Notifications]([userId]);
GO

CREATE INDEX [IX_Notifications_isRead] ON [dbo].[Notifications]([userId], [isRead]);
GO
