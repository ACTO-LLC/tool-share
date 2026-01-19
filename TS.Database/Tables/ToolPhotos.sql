CREATE TABLE [dbo].[ToolPhotos]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [toolId] UNIQUEIDENTIFIER NOT NULL,
    [url] NVARCHAR(500) NOT NULL,
    [isPrimary] BIT DEFAULT 0,
    [uploadedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_ToolPhotos_Tools] FOREIGN KEY ([toolId]) REFERENCES [dbo].[Tools]([id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_ToolPhotos_toolId] ON [dbo].[ToolPhotos]([toolId]);
GO
