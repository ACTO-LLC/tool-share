CREATE TABLE [dbo].[Circles]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [name] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(500) NULL,
    [inviteCode] NVARCHAR(20) NOT NULL,
    [isPublic] BIT DEFAULT 0,
    [createdBy] UNIQUEIDENTIFIER NOT NULL,
    [createdAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT [UQ_Circles_inviteCode] UNIQUE ([inviteCode]),
    CONSTRAINT [FK_Circles_Users] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[Users]([id])
);
GO

CREATE INDEX [IX_Circles_inviteCode] ON [dbo].[Circles]([inviteCode]);
GO

CREATE INDEX [IX_Circles_createdBy] ON [dbo].[Circles]([createdBy]);
GO
