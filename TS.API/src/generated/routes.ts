/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UsersController } from './../routes/usersController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ToolsController } from './../routes/toolsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SubscriptionsController } from './../routes/subscriptionsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ReservationsController } from './../routes/reservationsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { NotificationsController } from './../routes/reservationsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserReviewsController } from './../routes/reservationsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthController } from './../routes/healthController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CirclesController } from './../routes/circlesController';
import { expressAuthentication } from './../middleware/auth';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
const multer = require('multer');


const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "UserProfileResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "externalId": {"dataType":"string","required":true},
            "displayName": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "phone": {"dataType":"string"},
            "avatarUrl": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "streetAddress": {"dataType":"string"},
            "city": {"dataType":"string"},
            "state": {"dataType":"string"},
            "zipCode": {"dataType":"string"},
            "reputationScore": {"dataType":"double","required":true},
            "notifyEmail": {"dataType":"boolean","required":true},
            "subscriptionStatus": {"dataType":"string","required":true},
            "subscriptionEndsAt": {"dataType":"string"},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateProfileRequest": {
        "dataType": "refObject",
        "properties": {
            "displayName": {"dataType":"string"},
            "phone": {"dataType":"string"},
            "avatarUrl": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "streetAddress": {"dataType":"string"},
            "city": {"dataType":"string"},
            "state": {"dataType":"string"},
            "zipCode": {"dataType":"string"},
            "notifyEmail": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PublicUserProfileResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "displayName": {"dataType":"string","required":true},
            "avatarUrl": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "city": {"dataType":"string"},
            "state": {"dataType":"string"},
            "reputationScore": {"dataType":"double","required":true},
            "memberSince": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HistoryItemResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "toolId": {"dataType":"string","required":true},
            "toolName": {"dataType":"string","required":true},
            "toolCategory": {"dataType":"string","required":true},
            "startDate": {"dataType":"string","required":true},
            "endDate": {"dataType":"string","required":true},
            "otherUserId": {"dataType":"string","required":true},
            "otherUserName": {"dataType":"string","required":true},
            "otherUserAvatarUrl": {"dataType":"string"},
            "hasReview": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserHistoryResponse": {
        "dataType": "refObject",
        "properties": {
            "lendingHistory": {"dataType":"array","array":{"dataType":"refObject","ref":"HistoryItemResponse"},"required":true},
            "borrowingHistory": {"dataType":"array","array":{"dataType":"refObject","ref":"HistoryItemResponse"},"required":true},
            "stats": {"dataType":"nestedObjectLiteral","nestedProperties":{"memberSince":{"dataType":"string","required":true},"totalLends":{"dataType":"double","required":true},"totalLoans":{"dataType":"double","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserReviewResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "reservationId": {"dataType":"string","required":true},
            "reviewerId": {"dataType":"string","required":true},
            "revieweeId": {"dataType":"string","required":true},
            "rating": {"dataType":"double","required":true},
            "comment": {"dataType":"string"},
            "createdAt": {"dataType":"string","required":true},
            "reviewer": {"dataType":"nestedObjectLiteral","nestedProperties":{"avatarUrl":{"dataType":"string"},"displayName":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},
            "reviewee": {"dataType":"nestedObjectLiteral","nestedProperties":{"avatarUrl":{"dataType":"string"},"displayName":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ToolLookupResponse": {
        "dataType": "refObject",
        "properties": {
            "found": {"dataType":"boolean","required":true},
            "name": {"dataType":"string"},
            "brand": {"dataType":"string"},
            "model": {"dataType":"string"},
            "description": {"dataType":"string"},
            "category": {"dataType":"string"},
            "imageUrl": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SearchResult": {
        "dataType": "refObject",
        "properties": {
            "upc": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "brand": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ToolResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "ownerId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "category": {"dataType":"string","required":true},
            "brand": {"dataType":"string"},
            "model": {"dataType":"string"},
            "upc": {"dataType":"string"},
            "status": {"dataType":"string","required":true},
            "advanceNoticeDays": {"dataType":"double","required":true},
            "maxLoanDays": {"dataType":"double","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string"},
            "owner": {"dataType":"nestedObjectLiteral","nestedProperties":{"reputationScore":{"dataType":"double","required":true},"state":{"dataType":"string"},"city":{"dataType":"string"},"avatarUrl":{"dataType":"string"},"displayName":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},
            "photos": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"uploadedAt":{"dataType":"string","required":true},"isPrimary":{"dataType":"boolean","required":true},"url":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ToolListResponse": {
        "dataType": "refObject",
        "properties": {
            "tools": {"dataType":"array","array":{"dataType":"refObject","ref":"ToolResponse"},"required":true},
            "total": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "pageSize": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateToolRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "category": {"dataType":"string","required":true},
            "brand": {"dataType":"string"},
            "model": {"dataType":"string"},
            "upc": {"dataType":"string"},
            "advanceNoticeDays": {"dataType":"double"},
            "maxLoanDays": {"dataType":"double"},
            "circleIds": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateToolRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "description": {"dataType":"string"},
            "category": {"dataType":"string"},
            "brand": {"dataType":"string"},
            "model": {"dataType":"string"},
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["available"]},{"dataType":"enum","enums":["unavailable"]}]},
            "advanceNoticeDays": {"dataType":"double"},
            "maxLoanDays": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PhotoUploadResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
            "isPrimary": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CheckoutResponse": {
        "dataType": "refObject",
        "properties": {
            "checkoutUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PortalResponse": {
        "dataType": "refObject",
        "properties": {
            "portalUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubscriptionStatusResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["trial"]},{"dataType":"enum","enums":["active"]},{"dataType":"enum","enums":["past_due"]},{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["none"]}],"required":true},
            "subscriptionEndsAt": {"dataType":"string"},
            "isInGracePeriod": {"dataType":"boolean","required":true},
            "canAccessFeatures": {"dataType":"boolean","required":true},
            "stripeCustomerId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReservationUserInfo": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "displayName": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "avatarUrl": {"dataType":"string"},
            "reputationScore": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReservationPhotoInfo": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
            "isPrimary": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReservationToolInfo": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "ownerId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "category": {"dataType":"string","required":true},
            "brand": {"dataType":"string"},
            "model": {"dataType":"string"},
            "status": {"dataType":"string","required":true},
            "owner": {"ref":"ReservationUserInfo"},
            "photos": {"dataType":"array","array":{"dataType":"refObject","ref":"ReservationPhotoInfo"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReservationResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "toolId": {"dataType":"string","required":true},
            "borrowerId": {"dataType":"string","required":true},
            "status": {"dataType":"string","required":true},
            "startDate": {"dataType":"string","required":true},
            "endDate": {"dataType":"string","required":true},
            "note": {"dataType":"string"},
            "ownerNote": {"dataType":"string"},
            "pickupConfirmedAt": {"dataType":"string"},
            "returnConfirmedAt": {"dataType":"string"},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string"},
            "tool": {"ref":"ReservationToolInfo"},
            "borrower": {"ref":"ReservationUserInfo"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReservationErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "code": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateReservationRequest": {
        "dataType": "refObject",
        "properties": {
            "toolId": {"dataType":"string","required":true},
            "startDate": {"dataType":"string","required":true},
            "endDate": {"dataType":"string","required":true},
            "note": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReservationListResponse": {
        "dataType": "refObject",
        "properties": {
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"ReservationResponse"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ActionRequest": {
        "dataType": "refObject",
        "properties": {
            "note": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeclineRequest": {
        "dataType": "refObject",
        "properties": {
            "reason": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DashboardStatsResponse": {
        "dataType": "refObject",
        "properties": {
            "toolsListed": {"dataType":"double","required":true},
            "activeLoans": {"dataType":"double","required":true},
            "pendingRequests": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoanPhotoResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "reservationId": {"dataType":"string","required":true},
            "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["before"]},{"dataType":"enum","enums":["after"]}],"required":true},
            "url": {"dataType":"string","required":true},
            "uploadedBy": {"dataType":"string","required":true},
            "notes": {"dataType":"string"},
            "uploadedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReviewUserInfo": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "displayName": {"dataType":"string","required":true},
            "avatarUrl": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReviewResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "reservationId": {"dataType":"string","required":true},
            "reviewerId": {"dataType":"string","required":true},
            "revieweeId": {"dataType":"string","required":true},
            "rating": {"dataType":"double","required":true},
            "comment": {"dataType":"string"},
            "createdAt": {"dataType":"string","required":true},
            "reviewer": {"ref":"ReviewUserInfo"},
            "reviewee": {"ref":"ReviewUserInfo"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateReviewRequest": {
        "dataType": "refObject",
        "properties": {
            "rating": {"dataType":"double","required":true},
            "comment": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "type": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "relatedId": {"dataType":"string"},
            "isRead": {"dataType":"boolean","required":true},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationListResponse": {
        "dataType": "refObject",
        "properties": {
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"NotificationResponse"},"required":true},
            "unreadCount": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserReviewsResponse": {
        "dataType": "refObject",
        "properties": {
            "reviews": {"dataType":"array","array":{"dataType":"refObject","ref":"ReviewResponse"},"required":true},
            "averageRating": {"dataType":"double","required":true},
            "totalReviews": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HealthResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"string","required":true},
            "timestamp": {"dataType":"string","required":true},
            "version": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CircleResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "inviteCode": {"dataType":"string","required":true},
            "isPublic": {"dataType":"boolean","required":true},
            "createdBy": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
            "memberCount": {"dataType":"double"},
            "currentUserRole": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["member"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["owner"]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCircleRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "isPublic": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CircleMemberResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["member"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["owner"]}],"required":true},
            "joinedAt": {"dataType":"string","required":true},
            "user": {"dataType":"nestedObjectLiteral","nestedProperties":{"reputationScore":{"dataType":"double","required":true},"avatarUrl":{"dataType":"string"},"email":{"dataType":"string","required":true},"displayName":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CircleToolResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "category": {"dataType":"string","required":true},
            "brand": {"dataType":"string"},
            "model": {"dataType":"string"},
            "status": {"dataType":"string","required":true},
            "owner": {"dataType":"nestedObjectLiteral","nestedProperties":{"avatarUrl":{"dataType":"string"},"displayName":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},
            "primaryPhotoUrl": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CircleDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "inviteCode": {"dataType":"string","required":true},
            "isPublic": {"dataType":"boolean","required":true},
            "createdBy": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
            "memberCount": {"dataType":"double"},
            "currentUserRole": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["member"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["owner"]}]},
            "members": {"dataType":"array","array":{"dataType":"refObject","ref":"CircleMemberResponse"}},
            "tools": {"dataType":"array","array":{"dataType":"refObject","ref":"CircleToolResponse"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JoinCircleRequest": {
        "dataType": "refObject",
        "properties": {
            "inviteCode": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InviteResponse": {
        "dataType": "refObject",
        "properties": {
            "inviteCode": {"dataType":"string","required":true},
            "inviteUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCircleMemberRoleRequest": {
        "dataType": "refObject",
        "properties": {
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["member"]},{"dataType":"enum","enums":["admin"]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsUsersController_getCurrentUser: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/users/me',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getCurrentUser)),

            async function UsersController_getCurrentUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getCurrentUser, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getCurrentUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_updateCurrentUser: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateProfileRequest"},
        };
        app.put('/api/users/me',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.updateCurrentUser)),

            async function UsersController_updateCurrentUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_updateCurrentUser, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'updateCurrentUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_getPublicProfile: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/users/:userId',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getPublicProfile)),

            async function UsersController_getPublicProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getPublicProfile, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getPublicProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_getMyHistory: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/users/me/history',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getMyHistory)),

            async function UsersController_getMyHistory(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getMyHistory, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getMyHistory',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_getUserHistory: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/users/:userId/history',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getUserHistory)),

            async function UsersController_getUserHistory(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getUserHistory, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getUserHistory',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_getMyReviews: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/users/me/reviews',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getMyReviews)),

            async function UsersController_getMyReviews(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getMyReviews, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getMyReviews',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_getUserReviews: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/users/:userId/reviews',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getUserReviews)),

            async function UsersController_getUserReviews(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getUserReviews, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getUserReviews',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_lookupTool: Record<string, TsoaRoute.ParameterSchema> = {
                upc: {"in":"query","name":"upc","required":true,"dataType":"string"},
        };
        app.get('/api/tools/lookup',
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.lookupTool)),

            async function ToolsController_lookupTool(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_lookupTool, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'lookupTool',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_searchToolsUpc: Record<string, TsoaRoute.ParameterSchema> = {
                q: {"in":"query","name":"q","required":true,"dataType":"string"},
        };
        app.get('/api/tools/lookup/search',
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.searchToolsUpc)),

            async function ToolsController_searchToolsUpc(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_searchToolsUpc, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'searchToolsUpc',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_getCategories: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/tools/categories',
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.getCategories)),

            async function ToolsController_getCategories(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_getCategories, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'getCategories',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_searchTools: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                q: {"in":"query","name":"q","dataType":"string"},
                category: {"in":"query","name":"category","dataType":"string"},
                circleId: {"in":"query","name":"circleId","dataType":"string"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/api/tools/search',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.searchTools)),

            async function ToolsController_searchTools(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_searchTools, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'searchTools',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_browseTools: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                category: {"in":"query","name":"category","dataType":"string"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/api/tools/browse',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.browseTools)),

            async function ToolsController_browseTools(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_browseTools, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'browseTools',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_createTool: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateToolRequest"},
        };
        app.post('/api/tools',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.createTool)),

            async function ToolsController_createTool(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_createTool, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'createTool',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_getTool: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/tools/:id',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.getTool)),

            async function ToolsController_getTool(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_getTool, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'getTool',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_getMyTools: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/tools/my/tools',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.getMyTools)),

            async function ToolsController_getMyTools(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_getMyTools, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'getMyTools',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_updateTool: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateToolRequest"},
        };
        app.put('/api/tools/:id',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.updateTool)),

            async function ToolsController_updateTool(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_updateTool, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'updateTool',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_deleteTool: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/tools/:id',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.deleteTool)),

            async function ToolsController_deleteTool(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_deleteTool, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'deleteTool',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_uploadToolPhoto: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
                isPrimary: {"in":"formData","name":"isPrimary","dataType":"string"},
        };
        app.post('/api/tools/:id/photos',
            authenticateMiddleware([{"Bearer":[]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.uploadToolPhoto)),

            async function ToolsController_uploadToolPhoto(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_uploadToolPhoto, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'uploadToolPhoto',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_deleteToolPhoto: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                toolId: {"in":"path","name":"toolId","required":true,"dataType":"string"},
                photoId: {"in":"path","name":"photoId","required":true,"dataType":"string"},
        };
        app.delete('/api/tools/:toolId/photos/:photoId',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.deleteToolPhoto)),

            async function ToolsController_deleteToolPhoto(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_deleteToolPhoto, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'deleteToolPhoto',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsToolsController_setPhotoPrimary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                toolId: {"in":"path","name":"toolId","required":true,"dataType":"string"},
                photoId: {"in":"path","name":"photoId","required":true,"dataType":"string"},
        };
        app.put('/api/tools/:toolId/photos/:photoId/primary',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ToolsController)),
            ...(fetchMiddlewares<RequestHandler>(ToolsController.prototype.setPhotoPrimary)),

            async function ToolsController_setPhotoPrimary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsToolsController_setPhotoPrimary, request, response });

                const controller = new ToolsController();

              await templateService.apiHandler({
                methodName: 'setPhotoPrimary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSubscriptionsController_createCheckout: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/subscriptions/checkout',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SubscriptionsController)),
            ...(fetchMiddlewares<RequestHandler>(SubscriptionsController.prototype.createCheckout)),

            async function SubscriptionsController_createCheckout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSubscriptionsController_createCheckout, request, response });

                const controller = new SubscriptionsController();

              await templateService.apiHandler({
                methodName: 'createCheckout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSubscriptionsController_getPortal: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/subscriptions/portal',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SubscriptionsController)),
            ...(fetchMiddlewares<RequestHandler>(SubscriptionsController.prototype.getPortal)),

            async function SubscriptionsController_getPortal(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSubscriptionsController_getPortal, request, response });

                const controller = new SubscriptionsController();

              await templateService.apiHandler({
                methodName: 'getPortal',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSubscriptionsController_getSubscriptionStatus: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/subscriptions/status',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SubscriptionsController)),
            ...(fetchMiddlewares<RequestHandler>(SubscriptionsController.prototype.getSubscriptionStatus)),

            async function SubscriptionsController_getSubscriptionStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSubscriptionsController_getSubscriptionStatus, request, response });

                const controller = new SubscriptionsController();

              await templateService.apiHandler({
                methodName: 'getSubscriptionStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_createReservation: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateReservationRequest"},
        };
        app.post('/api/reservations',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.createReservation)),

            async function ReservationsController_createReservation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_createReservation, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'createReservation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_getReservations: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                role: {"in":"query","name":"role","dataType":"union","subSchemas":[{"dataType":"enum","enums":["borrower"]},{"dataType":"enum","enums":["lender"]},{"dataType":"enum","enums":["all"]}]},
                status: {"in":"query","name":"status","dataType":"string"},
        };
        app.get('/api/reservations',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.getReservations)),

            async function ReservationsController_getReservations(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_getReservations, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'getReservations',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_getReservation: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/reservations/:id',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.getReservation)),

            async function ReservationsController_getReservation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_getReservation, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'getReservation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_approveReservation: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","ref":"ActionRequest"},
        };
        app.post('/api/reservations/:id/approve',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.approveReservation)),

            async function ReservationsController_approveReservation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_approveReservation, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'approveReservation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_declineReservation: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"DeclineRequest"},
        };
        app.post('/api/reservations/:id/decline',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.declineReservation)),

            async function ReservationsController_declineReservation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_declineReservation, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'declineReservation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_cancelReservation: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","ref":"ActionRequest"},
        };
        app.post('/api/reservations/:id/cancel',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.cancelReservation)),

            async function ReservationsController_cancelReservation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_cancelReservation, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'cancelReservation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_confirmPickup: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","ref":"ActionRequest"},
        };
        app.post('/api/reservations/:id/pickup',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.confirmPickup)),

            async function ReservationsController_confirmPickup(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_confirmPickup, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'confirmPickup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_confirmReturn: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","ref":"ActionRequest"},
        };
        app.post('/api/reservations/:id/return',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.confirmReturn)),

            async function ReservationsController_confirmReturn(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_confirmReturn, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'confirmReturn',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_getDashboardStats: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/reservations/stats/dashboard',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.getDashboardStats)),

            async function ReservationsController_getDashboardStats(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_getDashboardStats, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'getDashboardStats',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_uploadLoanPhoto: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
                type: {"in":"formData","name":"type","required":true,"dataType":"string"},
                notes: {"in":"formData","name":"notes","dataType":"string"},
        };
        app.post('/api/reservations/:id/photos',
            authenticateMiddleware([{"Bearer":[]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.uploadLoanPhoto)),

            async function ReservationsController_uploadLoanPhoto(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_uploadLoanPhoto, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'uploadLoanPhoto',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_getLoanPhotos: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                type: {"in":"query","name":"type","dataType":"union","subSchemas":[{"dataType":"enum","enums":["before"]},{"dataType":"enum","enums":["after"]}]},
        };
        app.get('/api/reservations/:id/photos',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.getLoanPhotos)),

            async function ReservationsController_getLoanPhotos(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_getLoanPhotos, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'getLoanPhotos',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_createReview: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateReviewRequest"},
        };
        app.post('/api/reservations/:id/review',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.createReview)),

            async function ReservationsController_createReview(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_createReview, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'createReview',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReservationsController_getReservationReviews: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/reservations/:id/reviews',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController)),
            ...(fetchMiddlewares<RequestHandler>(ReservationsController.prototype.getReservationReviews)),

            async function ReservationsController_getReservationReviews(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReservationsController_getReservationReviews, request, response });

                const controller = new ReservationsController();

              await templateService.apiHandler({
                methodName: 'getReservationReviews',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotificationsController_getNotifications: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                limit: {"in":"query","name":"limit","dataType":"double"},
        };
        app.get('/api/notifications',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController.prototype.getNotifications)),

            async function NotificationsController_getNotifications(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationsController_getNotifications, request, response });

                const controller = new NotificationsController();

              await templateService.apiHandler({
                methodName: 'getNotifications',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotificationsController_getUnreadCount: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/notifications/unread-count',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController.prototype.getUnreadCount)),

            async function NotificationsController_getUnreadCount(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationsController_getUnreadCount, request, response });

                const controller = new NotificationsController();

              await templateService.apiHandler({
                methodName: 'getUnreadCount',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotificationsController_markAsRead: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.post('/api/notifications/:id/read',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController.prototype.markAsRead)),

            async function NotificationsController_markAsRead(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationsController_markAsRead, request, response });

                const controller = new NotificationsController();

              await templateService.apiHandler({
                methodName: 'markAsRead',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotificationsController_markAllAsRead: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/notifications/read-all',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController.prototype.markAllAsRead)),

            async function NotificationsController_markAllAsRead(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationsController_markAllAsRead, request, response });

                const controller = new NotificationsController();

              await templateService.apiHandler({
                methodName: 'markAllAsRead',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserReviewsController_getUserReviews: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/users/:id/reviews',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserReviewsController)),
            ...(fetchMiddlewares<RequestHandler>(UserReviewsController.prototype.getUserReviews)),

            async function UserReviewsController_getUserReviews(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserReviewsController_getUserReviews, request, response });

                const controller = new UserReviewsController();

              await templateService.apiHandler({
                methodName: 'getUserReviews',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_getHealth: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.getHealth)),

            async function HealthController_getHealth(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_getHealth, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'getHealth',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCirclesController_createCircle: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateCircleRequest"},
        };
        app.post('/api/circles',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CirclesController)),
            ...(fetchMiddlewares<RequestHandler>(CirclesController.prototype.createCircle)),

            async function CirclesController_createCircle(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCirclesController_createCircle, request, response });

                const controller = new CirclesController();

              await templateService.apiHandler({
                methodName: 'createCircle',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCirclesController_getMyCircles: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/circles',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CirclesController)),
            ...(fetchMiddlewares<RequestHandler>(CirclesController.prototype.getMyCircles)),

            async function CirclesController_getMyCircles(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCirclesController_getMyCircles, request, response });

                const controller = new CirclesController();

              await templateService.apiHandler({
                methodName: 'getMyCircles',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCirclesController_getCircle: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/circles/:id',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CirclesController)),
            ...(fetchMiddlewares<RequestHandler>(CirclesController.prototype.getCircle)),

            async function CirclesController_getCircle(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCirclesController_getCircle, request, response });

                const controller = new CirclesController();

              await templateService.apiHandler({
                methodName: 'getCircle',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCirclesController_joinCircle: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"JoinCircleRequest"},
        };
        app.post('/api/circles/:id/join',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CirclesController)),
            ...(fetchMiddlewares<RequestHandler>(CirclesController.prototype.joinCircle)),

            async function CirclesController_joinCircle(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCirclesController_joinCircle, request, response });

                const controller = new CirclesController();

              await templateService.apiHandler({
                methodName: 'joinCircle',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCirclesController_joinCircleByCode: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"JoinCircleRequest"},
        };
        app.post('/api/circles/join',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CirclesController)),
            ...(fetchMiddlewares<RequestHandler>(CirclesController.prototype.joinCircleByCode)),

            async function CirclesController_joinCircleByCode(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCirclesController_joinCircleByCode, request, response });

                const controller = new CirclesController();

              await templateService.apiHandler({
                methodName: 'joinCircleByCode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCirclesController_getInvite: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.post('/api/circles/:id/invite',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CirclesController)),
            ...(fetchMiddlewares<RequestHandler>(CirclesController.prototype.getInvite)),

            async function CirclesController_getInvite(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCirclesController_getInvite, request, response });

                const controller = new CirclesController();

              await templateService.apiHandler({
                methodName: 'getInvite',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCirclesController_removeMember: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
        };
        app.delete('/api/circles/:id/members/:userId',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CirclesController)),
            ...(fetchMiddlewares<RequestHandler>(CirclesController.prototype.removeMember)),

            async function CirclesController_removeMember(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCirclesController_removeMember, request, response });

                const controller = new CirclesController();

              await templateService.apiHandler({
                methodName: 'removeMember',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCirclesController_updateMemberRole: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateCircleMemberRoleRequest"},
        };
        app.put('/api/circles/:id/members/:userId',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CirclesController)),
            ...(fetchMiddlewares<RequestHandler>(CirclesController.prototype.updateMemberRole)),

            async function CirclesController_updateMemberRole(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCirclesController_updateMemberRole, request, response });

                const controller = new CirclesController();

              await templateService.apiHandler({
                methodName: 'updateMemberRole',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCirclesController_leaveCircle: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/circles/:id/members/me',
            authenticateMiddleware([{"Bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CirclesController)),
            ...(fetchMiddlewares<RequestHandler>(CirclesController.prototype.leaveCircle)),

            async function CirclesController_leaveCircle(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCirclesController_leaveCircle, request, response });

                const controller = new CirclesController();

              await templateService.apiHandler({
                methodName: 'leaveCircle',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
