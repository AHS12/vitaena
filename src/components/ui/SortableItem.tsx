import { useIsTouchDevice } from '@/hooks';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator } from '@mui/icons-material';
import { Box, IconButton, useTheme } from '@mui/material';
import React, { ReactNode } from 'react';

interface SortableItemProps {
    id: string;
    children: ReactNode;
    dragHandle?: boolean;
    disabled?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({
    id,
    children,
    dragHandle = true,
    disabled = false,
}) => {
    const theme = useTheme();
    const isTouchDevice = useIsTouchDevice();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        disabled
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Hide drag handle on touch devices in mobile view
    const shouldShowDragHandle = dragHandle && !disabled && (!isTouchDevice || !theme.breakpoints.down('md'));

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                position: 'relative',
                cursor: isDragging ? 'grabbing' : (disabled ? 'default' : 'grab'),
                // Add better touch handling
                touchAction: disabled ? 'auto' : 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                ...(isTouchDevice && {
                    // Add visual feedback for touch devices
                    '&:active': {
                        transform: 'scale(0.98)',
                        transition: 'transform 0.1s ease-in-out',
                    },
                }),
            }}
            {...(disabled ? {} : attributes)}
            {...(disabled ? {} : listeners)}
        >
            {shouldShowDragHandle && (
                <IconButton
                    size="small"
                    sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        cursor: 'grab',
                        color: 'action.disabled',
                        '&:hover': {
                            backgroundColor: 'action.hover',
                            color: 'action.active',
                        },
                        '&:active': {
                            cursor: 'grabbing',
                        },
                    }}
                    // Don't apply drag listeners to the handle on touch devices
                    // since the whole item is draggable
                    {...(!isTouchDevice ? attributes : {})}
                    {...(!isTouchDevice ? listeners : {})}
                >
                    <DragIndicator fontSize="small" />
                </IconButton>
            )}
            <Box sx={{ pl: shouldShowDragHandle ? 5 : 0 }}>
                {children}
            </Box>
        </Box>
    );
};
