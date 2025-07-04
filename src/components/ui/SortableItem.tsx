import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import React, { ReactNode } from 'react';

interface SortableItemProps {
    id: string;
    children: ReactNode;
    dragHandle?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({
    id,
    children,
    dragHandle = true,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
            }}
        >
            {dragHandle && (
                <IconButton
                    size="small"
                    sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        cursor: 'grab',
                        '&:hover': {
                            backgroundColor: 'action.hover',
                        },
                    }}
                    {...attributes}
                    {...listeners}
                >
                    <DragIndicator fontSize="small" />
                </IconButton>
            )}
            <Box sx={{ pl: dragHandle ? 5 : 0 }}>
                {children}
            </Box>
        </Box>
    );
};
