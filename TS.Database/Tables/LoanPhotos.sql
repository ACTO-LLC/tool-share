CREATE TABLE [dbo].[LoanPhotos]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [reservationId] UNIQUEIDENTIFIER NOT NULL,
    [type] NVARCHAR(20) NOT NULL,
    [url] NVARCHAR(500) NOT NULL,
    [uploadedBy] UNIQUEIDENTIFIER NOT NULL,
    [notes] NVARCHAR(500) NULL,
    [uploadedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_LoanPhotos_Reservations] FOREIGN KEY ([reservationId]) REFERENCES [dbo].[Reservations]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_LoanPhotos_Users] FOREIGN KEY ([uploadedBy]) REFERENCES [dbo].[Users]([id])
);
GO

CREATE INDEX [IX_LoanPhotos_reservationId] ON [dbo].[LoanPhotos]([reservationId]);
GO
