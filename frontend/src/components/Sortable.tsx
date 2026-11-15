/**
 * Lists people reorder by dragging a handle, or from the keyboard: Space on a handle
 * lifts the item and the arrows carry it, and Alt+↑/↓ anywhere inside an item moves it
 * one place. Each move is one call to onMove, so it can be one step to undo.
 */

import {closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent} from '@dnd-kit/core'
import {restrictToParentElement, restrictToVerticalAxis} from '@dnd-kit/modifiers'
import {rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {GripVertical} from 'lucide-react'
import type {HTMLAttributes, ReactNode} from 'react'

/** What a handle needs: spread these onto the element people grab. */
export type HandleProps = HTMLAttributes<HTMLElement> & {ref: (element: HTMLElement | null) => void}

function SortableItem({id, index, count, label, onMove, children, className}: {id: string; index: number; count: number; label: string; onMove(from: number, to: number): void; children(handle: HandleProps, dragging: boolean): ReactNode; className?: string}) {
    const {attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging} = useSortable({id})

    return (
        <div
            ref={setNodeRef}
            className={`sortable ${className ?? ''}`}
            data-dragging={isDragging || undefined}
            style={{transform: CSS.Translate.toString(transform), transition}}
            onKeyDown={(event) => {
                if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) {
                    return
                }

                // The innermost list takes the key, so a bullet moves rather than its job.
                event.stopPropagation()
                event.preventDefault()

                const to = event.key === 'ArrowUp' ? index - 1 : index + 1

                if (to >= 0 && to < count) {
                    onMove(index, to)
                }
            }}
        >
            {children({ref: setActivatorNodeRef, ...attributes, ...listeners, 'aria-label': `Move ${label}`, title: 'Drag to move, or Alt+↑/↓'} as HandleProps, isDragging)}
        </div>
    )
}

export function SortableList<T>({
    items,
    idOf,
    labelOf,
    onMove,
    layout = 'vertical',
    className,
    itemClassName,
    children,
}: {
    items: readonly T[]
    idOf(item: T, index: number): string
    /** What the item is called on its handle: "Move Experience". */
    labelOf(item: T, index: number): string
    onMove(from: number, to: number): void
    /** A column, or chips that wrap. */
    layout?: 'vertical' | 'wrap'
    className?: string
    itemClassName?: string
    children(item: T, index: number, handle: HandleProps, dragging: boolean): ReactNode
}) {
    const sensors = useSensors(
        // A few pixels of movement first, so a click on the handle stays a click.
        useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    )
    const ids = items.map(idOf)

    const onDragEnd = ({active, over}: DragEndEvent) => {
        if (over && active.id !== over.id) {
            onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={layout === 'vertical' ? [restrictToVerticalAxis, restrictToParentElement] : [restrictToParentElement]}
            onDragEnd={onDragEnd}
        >
            <SortableContext items={ids} strategy={layout === 'vertical' ? verticalListSortingStrategy : rectSortingStrategy}>
                <div className={className}>
                    {items.map((item, index) => (
                        <SortableItem key={ids[index]} id={ids[index]} index={index} count={items.length} label={labelOf(item, index)} onMove={onMove} className={itemClassName}>
                            {(handle, dragging) => children(item, index, handle, dragging)}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}

/** The grip people drag by. */
export function DragHandle({handle, size = 14}: {handle: HandleProps; size?: number}) {
    return (
        <button type="button" className="drag-handle" {...(handle as HTMLAttributes<HTMLButtonElement>)} ref={handle.ref}>
            <GripVertical size={size} aria-hidden="true" />
        </button>
    )
}
