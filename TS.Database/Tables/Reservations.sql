CREATE TABLE [dbo].[Reservations]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [toolId] UNIQUEIDENTIFIER NOT NULL,
    [borrowerId] UNIQUEIDENTIFIER NOT NULL,
    [status] NVARCHAR(20) NOT NULL DEFAULT 'pending',
    [startDate] DATE NOT NULL,
    [endDate] DATE NOT NULL,
    [note] NVARCHAR(500) NULL,
    [ownerNote] NVARCHAR(500) NULL,
    [pickupConfirmedAt] DATETIME2 NULL,
    [returnConfirmedAt] DATETIME2 NULL,
    [createdAt] DATETIME2 DEFAULT GETUTCDATE(),
    [updatedAt] DATETIME2 NULL,
    CONSTRAINT [CK_Reservations_Dates] CHECK ([endDate] >= [startDate]),
    CONSTRAINT [FK_Reservations_Tools] FOREIGN KEY ([toolId]) REFERENCES [dbo].[Tools]([id]),
    CONSTRAINT [FK_Reservations_Users] FOREIGN KEY ([borrowerId]) REFERENCES [dbo].[Users]([id])
);
GO

CREATE INDEX [IX_Reservations_toolId] ON [dbo].[Reservations]([toolId]);
GO

CREATE INDEX [IX_Reservations_borrowerId] ON [dbo].[Reservations]([borrowerId]);
GO

CREATE INDEX [IX_Reservations_status] ON [dbo].[Reservations]([status]);
GO

CREATE INDEX [IX_Reservations_dates] ON [dbo].[Reservations]([startDate], [endDate]);
GO
