export const ORDER_STATUS = {
    DRAFT: 'Draft',
    READY_FOR_PICKUP: 'Ready for Pickup',
    PICKED_UP: 'Picked Up',
    IN_TRANSIT: 'In Transit',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
} as const;

export const ORDER_STATUS_LABELS = [
    ORDER_STATUS.DRAFT,
    ORDER_STATUS.READY_FOR_PICKUP,
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
] as const;

export type OrderStatusType = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Mapping untuk status integer ke status string
export const STATUS_INTEGER_MAPPING = {
    // Pickup status mapping
    PICKUP_STATUS: {
        0: ORDER_STATUS.READY_FOR_PICKUP,
        1: ORDER_STATUS.PICKED_UP,
    },
    // Outbound status mapping
    OUTBOUND_STATUS: {
        0: ORDER_STATUS.READY_FOR_PICKUP,
        1: ORDER_STATUS.IN_TRANSIT,
    },
    // Inbound status mapping
    INBOUND_STATUS: {
        0: ORDER_STATUS.IN_TRANSIT,
        1: ORDER_STATUS.OUT_FOR_DELIVERY,
    },
    // Delivery status mapping
    DELIVERY_STATUS: {
        0: ORDER_STATUS.OUT_FOR_DELIVERY,
        1: ORDER_STATUS.DELIVERED,
    },
} as const;

// Helper function untuk mendapatkan status berdasarkan pieces
export const getOrderStatusFromPieces = (pieces: any[]): OrderStatusType => {
    if (!pieces || pieces.length === 0) {
        return ORDER_STATUS.DRAFT;
    }

    // Check if all pieces are delivered
    const allDelivered = pieces.every(piece => piece.deliver_status === 1);
    if (allDelivered) {
        return ORDER_STATUS.DELIVERED;
    }

    // Check if all pieces are out for delivery
    const allOutForDelivery = pieces.every(piece => piece.inbound_status === 1 && piece.deliver_status === 0);
    if (allOutForDelivery) {
        return ORDER_STATUS.OUT_FOR_DELIVERY;
    }

    // Check if all pieces are in transit
    const allInTransit = pieces.every(piece => piece.outbound_status === 1 && piece.inbound_status === 0);
    if (allInTransit) {
        return ORDER_STATUS.IN_TRANSIT;
    }

    // Check if all pieces are picked up
    const allPickedUp = pieces.every(piece => piece.pickup_status === 1 && piece.outbound_status === 0);
    if (allPickedUp) {
        return ORDER_STATUS.PICKED_UP;
    }

    // Default to ready for pickup
    return ORDER_STATUS.READY_FOR_PICKUP;
}; 