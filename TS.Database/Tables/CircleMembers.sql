CREATE TABLE [dbo].[CircleMembers]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [circleId] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [role] NVARCHAR(20) NOT NULL DEFAULT 'member',
    [joinedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT [UQ_CircleMembers_CircleUser] UNIQUE ([circleId], [userId]),
    CONSTRAINT [FK_CircleMembers_Circles] FOREIGN KEY ([circleId]) REFERENCES [dbo].[Circles]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_CircleMembers_Users] FOREIGN KEY ([userId]) REFERENCES [dbo].[Users]([id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_CircleMembers_circleId] ON [dbo].[CircleMembers]([circleId]);
GO

CREATE INDEX [IX_CircleMembers_userId] ON [dbo].[CircleMembers]([userId]);
GO
