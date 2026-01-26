/*
Post-Deployment Script - Seed Data
For local development only

This script is run after the database schema has been deployed.
Creates test users, circles, tools, reservations, and reviews.
*/

-- Only insert seed data if it doesn't exist (idempotent)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [id] = '11111111-1111-1111-1111-111111111111')
BEGIN
    -- ========================================
    -- USERS
    -- ========================================
    -- Test User 1 - Primary test user (tool owner)
    INSERT INTO [dbo].[Users] ([id], [externalId], [displayName], [email], [phone], [city], [state], [zipCode], [streetAddress], [bio], [reputationScore], [subscriptionStatus], [tosAcceptedAt])
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'test-user-1', 'John Doe', 'john@example.com', '555-123-4567', 'San Francisco', 'CA', '94102', '123 Main St', 'Tool enthusiast with a well-stocked garage.', 4.75, 'active', GETUTCDATE());

    -- Test User 2 - Borrower
    INSERT INTO [dbo].[Users] ([id], [externalId], [displayName], [email], [phone], [city], [state], [zipCode], [streetAddress], [bio], [reputationScore], [subscriptionStatus], [tosAcceptedAt])
    VALUES
        ('66666666-6666-6666-6666-666666666666', 'test-user-2', 'Jane Smith', 'jane@example.com', '555-987-6543', 'San Francisco', 'CA', '94103', '456 Oak Ave', 'DIY weekend warrior. Always working on home projects.', 4.50, 'active', GETUTCDATE());

    -- Test User 3 - Another member
    INSERT INTO [dbo].[Users] ([id], [externalId], [displayName], [email], [phone], [city], [state], [bio], [subscriptionStatus], [tosAcceptedAt])
    VALUES
        ('77777777-7777-7777-7777-777777777777', 'test-user-3', 'Mike Wilson', 'mike@example.com', '555-456-7890', 'Oakland', 'CA', 'Woodworking hobbyist.', 'active', GETUTCDATE());

    -- ========================================
    -- CIRCLES
    -- ========================================
    -- Friends Circle - Private invite-only
    INSERT INTO [dbo].[Circles] ([id], [name], [description], [inviteCode], [isPublic], [createdBy])
    VALUES
        ('22222222-2222-2222-2222-222222222222', 'Friends Circle', 'A circle for close friends to share tools', 'FRIEND123', 0, '11111111-1111-1111-1111-111111111111');

    -- Neighborhood Circle - Public
    INSERT INTO [dbo].[Circles] ([id], [name], [description], [inviteCode], [isPublic], [createdBy])
    VALUES
        ('88888888-8888-8888-8888-888888888888', 'SF Makers', 'San Francisco maker community tool sharing', 'SFMAKER2026', 1, '77777777-7777-7777-7777-777777777777');

    -- ========================================
    -- CIRCLE MEMBERS
    -- ========================================
    -- Friends Circle memberships
    INSERT INTO [dbo].[CircleMembers] ([circleId], [userId], [role])
    VALUES
        ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'owner'),
        ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'member'),
        ('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'admin');

    -- SF Makers Circle memberships
    INSERT INTO [dbo].[CircleMembers] ([circleId], [userId], [role])
    VALUES
        ('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'owner'),
        ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'member'),
        ('88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', 'member');

    -- ========================================
    -- TOOLS
    -- ========================================
    -- John's tools
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
         'DeWalt Cordless Drill', '20V MAX cordless drill/driver. Includes 2 batteries and charger. Great for general drilling and driving tasks.',
         'Power Tools', 'DeWalt', 'DCD771C2', '885911460491', 'available', 1, 7),
        ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
         'Extension Ladder', '24-foot aluminum extension ladder. Great for roof access and high work. OSHA compliant.',
         'Other', 'Werner', 'D1224-2', NULL, 'available', 2, 3),
        ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
         'Circular Saw', '7-1/4 inch circular saw with laser guide. 15 AMP motor for tough cuts.',
         'Power Tools', 'Makita', '5007MGA', '088381087094', 'available', 1, 5);

    -- Jane's tools
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666',
         'Pressure Washer', '3000 PSI electric pressure washer. Perfect for decks, driveways, and siding.',
         'Other', 'Ryobi', 'RY142300', 'available', 1, 2);

    -- Mike's tools
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [status])
    VALUES
        ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '77777777-7777-7777-7777-777777777777',
         'Table Saw', '10-inch contractor table saw with rolling stand. Great for ripping lumber.',
         'Power Tools', 'DeWalt', 'DWE7491RS', 'available'),
        ('BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB', '77777777-7777-7777-7777-777777777777',
         'Hand Plane', 'Stanley No. 4 smoothing plane. Vintage tool in excellent condition.',
         'Hand Tools', 'Stanley', 'No. 4', 'available');

    -- ========================================
    -- TOOL CIRCLES (which circles can see which tools)
    -- ========================================
    -- John's tools shared with Friends Circle
    INSERT INTO [dbo].[ToolCircles] ([toolId], [circleId])
    VALUES
        ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
        ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
        ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222');

    -- John's drill also shared with SF Makers
    INSERT INTO [dbo].[ToolCircles] ([toolId], [circleId])
    VALUES
        ('33333333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888');

    -- Jane's tool shared with both circles
    INSERT INTO [dbo].[ToolCircles] ([toolId], [circleId])
    VALUES
        ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222'),
        ('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888');

    -- Mike's tools shared with SF Makers
    INSERT INTO [dbo].[ToolCircles] ([toolId], [circleId])
    VALUES
        ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '88888888-8888-8888-8888-888888888888'),
        ('BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB', '88888888-8888-8888-8888-888888888888');

    -- ========================================
    -- TOOL PHOTOS
    -- ========================================
    INSERT INTO [dbo].[ToolPhotos] ([id], [toolId], [url], [isPrimary])
    VALUES
        ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC', '33333333-3333-3333-3333-333333333333', 'https://example.blob.core.windows.net/tools/drill-1.jpg', 1),
        ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', '44444444-4444-4444-4444-444444444444', 'https://example.blob.core.windows.net/tools/ladder-1.jpg', 1),
        ('EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE', '55555555-5555-5555-5555-555555555555', 'https://example.blob.core.windows.net/tools/saw-1.jpg', 1);

    -- ========================================
    -- RESERVATIONS (sample loan history)
    -- ========================================
    -- Completed reservation (Jane borrowed John's drill)
    INSERT INTO [dbo].[Reservations] ([id], [toolId], [borrowerId], [status], [startDate], [endDate], [note], [ownerNote], [pickupConfirmedAt], [returnConfirmedAt])
    VALUES
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666',
         'completed', '2026-01-10', '2026-01-12', 'Need to hang some shelves this weekend.', 'Enjoy!',
         '2026-01-10 09:00:00', '2026-01-12 17:00:00');

    -- Active reservation (Jane currently has the ladder)
    INSERT INTO [dbo].[Reservations] ([id], [toolId], [borrowerId], [status], [startDate], [endDate], [note], [pickupConfirmedAt])
    VALUES
        ('11111111-2222-3333-4444-555555555555', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666',
         'active', '2026-01-24', '2026-01-26', 'Cleaning gutters.', '2026-01-24 10:00:00');

    -- Pending reservation (Mike wants the circular saw)
    INSERT INTO [dbo].[Reservations] ([id], [toolId], [borrowerId], [status], [startDate], [endDate], [note])
    VALUES
        ('22222222-3333-4444-5555-666666666666', '55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777',
         'pending', '2026-02-01', '2026-02-03', 'Building a bookshelf for my office.');

    -- Confirmed future reservation
    INSERT INTO [dbo].[Reservations] ([id], [toolId], [borrowerId], [status], [startDate], [endDate], [note], [ownerNote])
    VALUES
        ('33333333-4444-5555-6666-777777777777', '99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111',
         'confirmed', '2026-02-15', '2026-02-16', 'Spring cleaning - need to wash the deck.', 'It is in the garage. Text me when you arrive.');

    -- ========================================
    -- LOAN PHOTOS (before/after photos)
    -- ========================================
    INSERT INTO [dbo].[LoanPhotos] ([reservationId], [type], [url], [uploadedBy], [notes])
    VALUES
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', 'before', 'https://example.blob.core.windows.net/loans/drill-before.jpg', '66666666-6666-6666-6666-666666666666', 'Drill in good condition at pickup'),
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', 'after', 'https://example.blob.core.windows.net/loans/drill-after.jpg', '66666666-6666-6666-6666-666666666666', 'Returned in same condition');

    -- ========================================
    -- REVIEWS
    -- ========================================
    -- Jane reviews John (as tool owner) for the completed drill reservation
    INSERT INTO [dbo].[Reviews] ([reservationId], [reviewerId], [revieweeId], [rating], [comment])
    VALUES
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
         5, 'Great tool, worked perfectly! John was very accommodating with pickup time.');

    -- John reviews Jane (as borrower) for the completed drill reservation
    INSERT INTO [dbo].[Reviews] ([reservationId], [reviewerId], [revieweeId], [rating], [comment])
    VALUES
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666',
         5, 'Jane returned the drill on time and in perfect condition. Would lend to again!');

    -- ========================================
    -- NOTIFICATIONS
    -- ========================================
    INSERT INTO [dbo].[Notifications] ([userId], [type], [title], [message], [relatedId], [isRead])
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'reservation_request', 'New Reservation Request', 'Mike Wilson wants to borrow your Circular Saw from Feb 1-3.', '22222222-3333-4444-5555-666666666666', 0),
        ('66666666-6666-6666-6666-666666666666', 'reservation_confirmed', 'Reservation Confirmed', 'Your reservation for the Pressure Washer has been confirmed.', '33333333-4444-5555-6666-777777777777', 1),
        ('77777777-7777-7777-7777-777777777777', 'new_review', 'New Review', 'John Doe left you a 5-star review!', 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', 0);

    PRINT 'Seed data inserted successfully';
END
ELSE
BEGIN
    PRINT 'Seed data already exists, skipping';
END
GO
