CREATE TABLE [dbo].[ToolCircles]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [toolId] UNIQUEIDENTIFIER NOT NULL,
    [circleId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [UQ_ToolCircles_ToolCircle] UNIQUE ([toolId], [circleId]),
    CONSTRAINT [FK_ToolCircles_Tools] FOREIGN KEY ([toolId]) REFERENCES [dbo].[Tools]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ToolCircles_Circles] FOREIGN KEY ([circleId]) REFERENCES [dbo].[Circles]([id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_ToolCircles_toolId] ON [dbo].[ToolCircles]([toolId]);
GO

CREATE INDEX [IX_ToolCircles_circleId] ON [dbo].[ToolCircles]([circleId]);
GO
