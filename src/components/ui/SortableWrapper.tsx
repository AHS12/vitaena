import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
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
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Add a minimum distance to prevent conflicts with click events
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            // Configure touch sensor with proper activation constraints
            activationConstraint: {
                delay: 100,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        if (disabled) return;

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

    if (disabled) {
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
