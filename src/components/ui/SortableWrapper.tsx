import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
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
}

export const SortableWrapper = <T,>({
    items,
    onReorder,
    children,
    idPrefix,
}: SortableWrapperProps<T>) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
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
