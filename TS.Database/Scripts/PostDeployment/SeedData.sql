/*
Post-Deployment Script - Seed Data
For local development only

This script is run after the database schema has been deployed.
Creates test users, circles, tools, reservations, and reviews.

Tool data based on real products with actual UPC codes for realistic testing.
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
        ('11111111-1111-1111-1111-111111111111', 'test-user-1', 'John Doe', 'john@example.com', '555-123-4567', 'San Francisco', 'CA', '94102', '123 Main St', 'Tool enthusiast with a well-stocked garage. Happy to share my collection with neighbors!', 4.75, 'active', GETUTCDATE());

    -- Test User 2 - Borrower
    INSERT INTO [dbo].[Users] ([id], [externalId], [displayName], [email], [phone], [city], [state], [zipCode], [streetAddress], [bio], [reputationScore], [subscriptionStatus], [tosAcceptedAt])
    VALUES
        ('66666666-6666-6666-6666-666666666666', 'test-user-2', 'Jane Smith', 'jane@example.com', '555-987-6543', 'San Francisco', 'CA', '94103', '456 Oak Ave', 'DIY weekend warrior. Always working on home improvement projects.', 4.50, 'active', GETUTCDATE());

    -- Test User 3 - Another member
    INSERT INTO [dbo].[Users] ([id], [externalId], [displayName], [email], [phone], [city], [state], [bio], [subscriptionStatus], [tosAcceptedAt])
    VALUES
        ('77777777-7777-7777-7777-777777777777', 'test-user-3', 'Mike Wilson', 'mike@example.com', '555-456-7890', 'Oakland', 'CA', 'Woodworking hobbyist and furniture maker. 10+ years experience.', 'active', GETUTCDATE());

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
    -- TOOLS - Real products with actual UPCs
    -- ========================================

    -- ----------------------------------------
    -- John's Tools (test-user-1)
    -- ----------------------------------------

    -- DeWalt 20V MAX Cordless Drill/Driver Kit
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
         'DeWalt 20V MAX Cordless Drill/Driver Kit',
         'Compact, lightweight design fits into tight areas. High-performance motor delivers 300 unit watts out (UWO) of power. 2-speed transmission (0-450 / 0-1,500 RPM). Includes two 20V MAX batteries, charger, and kit bag. Perfect for drilling and fastening in wood, metal, and plastic.',
         'Power Tools', 'DeWalt', 'DCD771C2', '885911460491', 'available', 1, 7);

    -- Makita 7-1/4" Circular Saw with Electric Brake
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
         'Makita 7-1/4" Magnesium Circular Saw',
         '15 AMP motor delivers 5,800 RPM for faster cutting and ripping through lumber. Built-in dust blower clears line of cut. Two built-in LED lights illuminate the line of cut. Electric brake stops the blade in under 2 seconds. Magnesium components for reduced weight (10.6 lbs).',
         'Power Tools', 'Makita', '5007MGA', '088381087094', 'available', 1, 5);

    -- Werner 24 ft Aluminum Extension Ladder
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
         'Werner 24 ft Aluminum Extension Ladder',
         'Type II, 225 lb load capacity. ALFLO rung joint for twist resistance. Smooth operating pulley system. Spring-loaded locks engage automatically. Slip-resistant rubber shoes. Extended reach up to 23 feet. Great for roof access, painting, and gutter cleaning.',
         'Ladders & Scaffolding', 'Werner', 'D1224-2', '051751047837', 'available', 2, 3);

    -- Milwaukee M18 FUEL Impact Driver
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('11111111-AAAA-BBBB-CCCC-111111111111', '11111111-1111-1111-1111-111111111111',
         'Milwaukee M18 FUEL 1/4" Hex Impact Driver',
         'POWERSTATE brushless motor delivers 2,000 in-lbs of fastening torque. REDLINK PLUS intelligence prevents damage from overloading. 4-mode DRIVE CONTROL for precision fastening. 0-3,600 RPM and 0-4,700 IPM. Compact 4.59" length. Includes M18 XC 5.0 battery.',
         'Power Tools', 'Milwaukee', '2953-22', '045242316687', 'available', 1, 7);

    -- Bosch 4-1/2" Angle Grinder
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('22222222-AAAA-BBBB-CCCC-222222222222', '11111111-1111-1111-1111-111111111111',
         'Bosch 4-1/2" Small Angle Grinder',
         '7.5 Amp motor delivers high performance. Service Minder brush system provides brush wear indicator. Epoxy-coated field resists contamination. Two-position side handle for comfort. Spindle lock for easy wheel changes. Perfect for cutting, grinding, and polishing metal.',
         'Power Tools', 'Bosch', 'GWS8-45', '000346458909', 'available', 1, 5);

    -- Stanley FatMax 25 ft Tape Measure
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('33333333-AAAA-BBBB-CCCC-333333333333', '11111111-1111-1111-1111-111111111111',
         'Stanley FatMax 25 ft Tape Measure',
         '1-1/4" wide blade with 13 ft standout. BladeArmor coating on first 3" for durability. Cushion grip for comfort. Tru-Zero hook accurate inside/outside measurements. Mylar polyester film blade coating for extended life. 25 feet total length.',
         'Measuring & Layout', 'Stanley', 'FMHT33865', '076174900163', 'available', 0, 14);

    -- ----------------------------------------
    -- Jane's Tools (test-user-2)
    -- ----------------------------------------

    -- Ryobi 3000 PSI Electric Pressure Washer
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666',
         'Ryobi 3000 PSI Electric Pressure Washer',
         '3000 PSI and 1.1 GPM for heavy-duty cleaning. Brushless induction motor for longer life. Turbo nozzle for stubborn stains. On-board detergent tank. 25 ft high-pressure hose. Perfect for decks, driveways, siding, and patio furniture.',
         'Outdoor Power', 'Ryobi', 'RY142300', '033287229819', 'available', 1, 2);

    -- BLACK+DECKER 20V MAX Cordless Hedge Trimmer
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('44444444-AAAA-BBBB-CCCC-444444444444', '66666666-6666-6666-6666-666666666666',
         'BLACK+DECKER 20V MAX Cordless Hedge Trimmer',
         '22-inch dual-action blade for reduced vibration. 3/4" cut capacity. Lightweight design at 5.6 lbs. Full wrap-around front handle for comfort and control. 20V MAX lithium battery for fade-free power. Great for shaping and trimming hedges.',
         'Outdoor Power', 'BLACK+DECKER', 'LHT2220', '885911485005', 'available', 1, 3);

    -- Craftsman V20 Random Orbital Sander
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('55555555-AAAA-BBBB-CCCC-555555555555', '66666666-6666-6666-6666-666666666666',
         'Craftsman V20 5" Random Orbital Sander',
         'Variable speed 8,000-12,000 OPM. Dust-sealed switch for longer life. 3-position handle fits your grip. Hook and loop pad for fast paper changes. Dust collection bag included. Perfect for finishing work on wood surfaces.',
         'Power Tools', 'Craftsman', 'CMCW220B', '885911782241', 'available', 1, 5);

    -- ----------------------------------------
    -- Mike's Tools (test-user-3)
    -- ----------------------------------------

    -- DeWalt 10" Jobsite Table Saw
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '77777777-7777-7777-7777-777777777777',
         'DeWalt 10" Jobsite Table Saw with Rolling Stand',
         '15 Amp, 4,800 RPM motor. 32-1/2" rip capacity. Rack and pinion fence system for fast and accurate adjustments. 2-1/2" dust collection port. Site-Pro modular guarding system. Rolling stand for easy transport. Great for ripping plywood and dimensional lumber.',
         'Power Tools', 'DeWalt', 'DWE7491RS', '885911177801', 'available', 2, 5);

    -- Festool Domino Joiner
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB', '77777777-7777-7777-7777-777777777777',
         'Festool Domino DF 500 Joiner',
         'Revolutionary loose tenon joinery system. Cutter speeds of 24,500 RPM. Dust extraction at source. Adjustable cutting depth 12-28mm. 5 width settings. Creates mortises for Domino tenons in seconds. Essential for fine furniture making.',
         'Power Tools', 'Festool', 'DF 500 Q-Set', '4014549043929', 'available', 2, 7);

    -- Stanley No. 4 Smoothing Plane
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('66666666-AAAA-BBBB-CCCC-666666666666', '77777777-7777-7777-7777-777777777777',
         'Stanley Sweetheart No. 4 Smoothing Plane',
         'Classic bench plane design. Ductile cast iron base and frog. Cherry stained Beech handle and knob. 2" wide cutter blade. Precision ground sole. Lateral adjustment lever. Perfect for final smoothing and removing machine marks.',
         'Hand Tools', 'Stanley', '12-136', '076174121360', 'available', 1, 7);

    -- Bessey Parallel Clamps Set
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('77777777-AAAA-BBBB-CCCC-777777777777', '77777777-7777-7777-7777-777777777777',
         'Bessey K-Body REVO Parallel Clamp Set (4-Pack)',
         'Set includes 2x 24" and 2x 40" clamps. 1700 lb clamping force. Jaws stay parallel under load. Non-marring pads protect workpiece. Can be converted to spreader. Premium German engineering. Essential for panel glue-ups and assembly.',
         'Hand Tools', 'Bessey', 'KRE3524', '091162002471', 'available', 1, 7);

    -- Ridgid Shop Vacuum
    INSERT INTO [dbo].[Tools] ([id], [ownerId], [name], [description], [category], [brand], [model], [upc], [status], [advanceNoticeDays], [maxLoanDays])
    VALUES
        ('88888888-AAAA-BBBB-CCCC-888888888888', '77777777-7777-7777-7777-777777777777',
         'Ridgid 16 Gallon Wet/Dry Shop Vacuum',
         '6.5 peak HP motor. 16 gallon polypropylene drum. Converts to blower. Scroll noise reduction. Large drain for easy emptying. Includes car cleaning kit, wet nozzle, and utility nozzle. Great for shop cleanup and water extraction.',
         'Other', 'Ridgid', 'WD1851', '648846065052', 'available', 1, 5);

    -- ========================================
    -- TOOL CIRCLES (which circles can see which tools)
    -- ========================================
    -- John's tools shared with Friends Circle
    INSERT INTO [dbo].[ToolCircles] ([toolId], [circleId])
    VALUES
        ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
        ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
        ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222'),
        ('11111111-AAAA-BBBB-CCCC-111111111111', '22222222-2222-2222-2222-222222222222'),
        ('22222222-AAAA-BBBB-CCCC-222222222222', '22222222-2222-2222-2222-222222222222'),
        ('33333333-AAAA-BBBB-CCCC-333333333333', '22222222-2222-2222-2222-222222222222');

    -- John's tools also shared with SF Makers
    INSERT INTO [dbo].[ToolCircles] ([toolId], [circleId])
    VALUES
        ('33333333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888'),
        ('55555555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888');

    -- Jane's tools shared with both circles
    INSERT INTO [dbo].[ToolCircles] ([toolId], [circleId])
    VALUES
        ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222'),
        ('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888'),
        ('44444444-AAAA-BBBB-CCCC-444444444444', '22222222-2222-2222-2222-222222222222'),
        ('55555555-AAAA-BBBB-CCCC-555555555555', '22222222-2222-2222-2222-222222222222');

    -- Mike's tools shared with SF Makers
    INSERT INTO [dbo].[ToolCircles] ([toolId], [circleId])
    VALUES
        ('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '88888888-8888-8888-8888-888888888888'),
        ('BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB', '88888888-8888-8888-8888-888888888888'),
        ('66666666-AAAA-BBBB-CCCC-666666666666', '88888888-8888-8888-8888-888888888888'),
        ('77777777-AAAA-BBBB-CCCC-777777777777', '88888888-8888-8888-8888-888888888888'),
        ('88888888-AAAA-BBBB-CCCC-888888888888', '88888888-8888-8888-8888-888888888888');

    -- ========================================
    -- TOOL PHOTOS (Unsplash - free to use)
    -- ========================================
    -- John's Tools
    INSERT INTO [dbo].[ToolPhotos] ([id], [toolId], [url], [isPrimary])
    VALUES
        ('CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC', '33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800', 1),
        ('DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD', '55555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1504149573286-be426fc10e94?w=800', 1),
        ('EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE', '44444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=800', 1),
        ('FFFFFFFF-1111-1111-1111-111111111111', '11111111-AAAA-BBBB-CCCC-111111111111', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800', 1),
        ('FFFFFFFF-2222-2222-2222-222222222222', '22222222-AAAA-BBBB-CCCC-222222222222', 'https://images.unsplash.com/photo-1580402427914-a6cc60d7b44f?w=800', 1),
        ('FFFFFFFF-3333-3333-3333-333333333333', '33333333-AAAA-BBBB-CCCC-333333333333', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800', 1);

    -- Jane's Tools
    INSERT INTO [dbo].[ToolPhotos] ([id], [toolId], [url], [isPrimary])
    VALUES
        ('FFFFFFFF-4444-4444-4444-444444444444', '99999999-9999-9999-9999-999999999999', 'https://images.unsplash.com/photo-1622219809260-ce065fc5277f?w=800', 1),
        ('FFFFFFFF-5555-5555-5555-555555555555', '44444444-AAAA-BBBB-CCCC-444444444444', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', 1),
        ('FFFFFFFF-6666-6666-6666-666666666666', '55555555-AAAA-BBBB-CCCC-555555555555', 'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=800', 1);

    -- Mike's Tools
    INSERT INTO [dbo].[ToolPhotos] ([id], [toolId], [url], [isPrimary])
    VALUES
        ('FFFFFFFF-7777-7777-7777-777777777777', 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800', 1),
        ('FFFFFFFF-8888-8888-8888-888888888888', 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB', 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800', 1),
        ('FFFFFFFF-9999-9999-9999-999999999999', '66666666-AAAA-BBBB-CCCC-666666666666', 'https://images.unsplash.com/photo-1567361672830-f7aa558027a3?w=800', 1),
        ('FFFFFFFF-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '77777777-AAAA-BBBB-CCCC-777777777777', 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=800', 1),
        ('FFFFFFFF-BBBB-BBBB-BBBB-BBBBBBBBBBBB', '88888888-AAAA-BBBB-CCCC-888888888888', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 1);

    -- ========================================
    -- RESERVATIONS (sample loan history)
    -- ========================================
    -- Completed reservation (Jane borrowed John's drill)
    INSERT INTO [dbo].[Reservations] ([id], [toolId], [borrowerId], [status], [startDate], [endDate], [note], [ownerNote], [pickupConfirmedAt], [returnConfirmedAt])
    VALUES
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666',
         'completed', '2026-01-10', '2026-01-12', 'Need to hang some shelves this weekend.', 'Enjoy! Battery charger is in the bag.',
         '2026-01-10 09:00:00', '2026-01-12 17:00:00');

    -- Active reservation (Jane currently has the ladder)
    INSERT INTO [dbo].[Reservations] ([id], [toolId], [borrowerId], [status], [startDate], [endDate], [note], [pickupConfirmedAt])
    VALUES
        ('11111111-2222-3333-4444-555555555555', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666',
         'active', '2026-01-24', '2026-01-26', 'Cleaning gutters before the rain.', '2026-01-24 10:00:00');

    -- Pending reservation (Mike wants the circular saw)
    INSERT INTO [dbo].[Reservations] ([id], [toolId], [borrowerId], [status], [startDate], [endDate], [note])
    VALUES
        ('22222222-3333-4444-5555-666666666666', '55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777',
         'pending', '2026-02-01', '2026-02-03', 'Building a bookshelf for my home office. Need to make a lot of crosscuts.');

    -- Confirmed future reservation
    INSERT INTO [dbo].[Reservations] ([id], [toolId], [borrowerId], [status], [startDate], [endDate], [note], [ownerNote])
    VALUES
        ('33333333-4444-5555-6666-777777777777', '99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111',
         'confirmed', '2026-02-15', '2026-02-16', 'Spring cleaning - need to power wash the deck and driveway.', 'Detergent is included. Park in driveway when you pick up.');

    -- ========================================
    -- LOAN PHOTOS (before/after photos)
    -- ========================================
    INSERT INTO [dbo].[LoanPhotos] ([reservationId], [type], [url], [uploadedBy], [notes])
    VALUES
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', 'before', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400', '66666666-6666-6666-6666-666666666666', 'Drill and batteries in good condition at pickup'),
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', 'after', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400', '66666666-6666-6666-6666-666666666666', 'Returned in same condition, batteries charged');

    -- ========================================
    -- REVIEWS
    -- ========================================
    -- Jane reviews John (as tool owner) for the completed drill reservation
    INSERT INTO [dbo].[Reviews] ([reservationId], [reviewerId], [revieweeId], [rating], [comment])
    VALUES
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
         5, 'Great tool, worked perfectly for my shelf project! John was very helpful explaining how to use the different drill bits. Would definitely borrow from him again.');

    -- John reviews Jane (as borrower) for the completed drill reservation
    INSERT INTO [dbo].[Reviews] ([reservationId], [reviewerId], [revieweeId], [rating], [comment])
    VALUES
        ('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666',
         5, 'Jane returned the drill on time and even charged the batteries before returning. Excellent borrower!');

    -- ========================================
    -- NOTIFICATIONS
    -- ========================================
    INSERT INTO [dbo].[Notifications] ([userId], [type], [title], [message], [relatedId], [isRead])
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'reservation_request', 'New Reservation Request', 'Mike Wilson wants to borrow your Makita 7-1/4" Magnesium Circular Saw from Feb 1-3.', '22222222-3333-4444-5555-666666666666', 0),
        ('66666666-6666-6666-6666-666666666666', 'reservation_confirmed', 'Reservation Confirmed', 'Your reservation for the Ryobi 3000 PSI Electric Pressure Washer has been confirmed for Feb 15-16.', '33333333-4444-5555-6666-777777777777', 1),
        ('77777777-7777-7777-7777-777777777777', 'new_review', 'New Review', 'John Doe left you a 5-star review!', 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', 0);

    PRINT 'Seed data inserted successfully';
END
ELSE
BEGIN
    PRINT 'Seed data already exists, skipping';
END
GO
