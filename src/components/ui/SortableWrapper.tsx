import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ReactNode } from 'react';

interface SortableWrapperProps<T> {
    items: T[];
    onReorder: (items: T[]) => void;
    children: ReactNode;
    idPrefix: string;
    disabled?: boolean;
}

export const SortableWrapper = <T,>({
    items,
    onReorder,
    children,
    idPrefix,
    disabled = false,
}: SortableWrapperProps<T>) => {
    // Simple disabled check
    const isDragDisabled = disabled;
    const sensors = useSensors(
        // Put TouchSensor first to prioritize it on touch devices
        useSensor(TouchSensor, {
            // Configure touch sensor with delay only (not distance as they're mutually exclusive)
            activationConstraint: {
                delay: 250, // 250ms hold time - good balance between preventing accidents and usability
                tolerance: 8, // Allow 8px movement during delay
            },
        }),
        useSensor(MouseSensor, {
            // Handle mouse events
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        if (isDragDisabled) return;

        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = items.findIndex((_, index) => `${idPrefix}-${index}` === active.id);
            const newIndex = items.findIndex((_, index) => `${idPrefix}-${index}` === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const updatedItems = arrayMove(items, oldIndex, newIndex);
                onReorder(updatedItems);
            }
        }
    };

    if (isDragDisabled) {
        return <>{children}</>;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map((_, index) => `${idPrefix}-${index}`)}
                strategy={verticalListSortingStrategy}
            >
                {children}
            </SortableContext>
        </DndContext>
    );
};
