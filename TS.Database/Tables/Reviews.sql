CREATE TABLE [dbo].[Reviews]
(
    [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [reservationId] UNIQUEIDENTIFIER NOT NULL,
    [reviewerId] UNIQUEIDENTIFIER NOT NULL,
    [revieweeId] UNIQUEIDENTIFIER NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(1000) NULL,
    [createdAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT [CK_Reviews_Rating] CHECK ([rating] BETWEEN 1 AND 5),
    CONSTRAINT [UQ_Reviews_ReservationReviewer] UNIQUE ([reservationId], [reviewerId]),
    CONSTRAINT [FK_Reviews_Reservations] FOREIGN KEY ([reservationId]) REFERENCES [dbo].[Reservations]([id]),
    CONSTRAINT [FK_Reviews_Reviewer] FOREIGN KEY ([reviewerId]) REFERENCES [dbo].[Users]([id]),
    CONSTRAINT [FK_Reviews_Reviewee] FOREIGN KEY ([revieweeId]) REFERENCES [dbo].[Users]([id])
);
GO

CREATE INDEX [IX_Reviews_reservationId] ON [dbo].[Reviews]([reservationId]);
GO

CREATE INDEX [IX_Reviews_revieweeId] ON [dbo].[Reviews]([revieweeId]);
GO
