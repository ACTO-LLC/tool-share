/*
Post-Deployment Script - Seed Data
For local development only

This script is run after the database schema has been deployed.
*/

-- Only insert seed data if it doesn't exist (idempotent)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [id] = '11111111-1111-1111-1111-111111111111')
BEGIN
    -- Insert test user (will be replaced by actual Azure AD B2C user)
    INSERT INTO [dbo].[Users] ([id], [externalId], [displayName], [email], [city], [state], [subscriptionStatus], [tosAcceptedAt])
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'test-user-1', 'Test User', 'test@example.com', 'San Francisco', 'CA', 'active', GETUTCDATE());

    -- Insert a test circle
    INSERT INTO [dbo].[Circles] ([id], [name], [description], [inviteCode], [isPublic], [createdBy])
    VALUES
        ('22222222-2222-2222-2222-222222222222', 'Friends Circle', 'A circle for close friends', 'FRIEND123', 0, '11111111-1111-1111-1111-111111111111');

    -- Add test user to circle as owner
    INSERT INTO [dbo].[CircleMembers] ([circleId], [userId], [role])
    VALUES
        ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'owner');

    -- Insert sample tools
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [status])
    VALUES
        ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
         'DeWalt Cordless Drill', '20V MAX cordless drill/driver. Includes 2 batteries and charger.',
         'Power Tools', 'DeWalt', 'DCD771C2', 'available'),
        ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
         'Extension Ladder', '24-foot aluminum extension ladder. Great for roof access.',
         'Other', 'Werner', 'D1224-2', 'available'),
        ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
         'Circular Saw', '7-1/4 inch circular saw with laser guide.',
         'Power Tools', 'Makita', '5007MGA', 'available');

    -- Link tools to circle
    INSERT INTO [dbo].[ToolCircles] ([toolId], [circleId])
    VALUES
        ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
        ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
        ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222');

    PRINT 'Seed data inserted successfully';
END
ELSE
BEGIN
    PRINT 'Seed data already exists, skipping';
END
GO
