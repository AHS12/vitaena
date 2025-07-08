import { useResumeStore } from '@/stores/resume-store';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

export const TemplateSwitcher = ({ size = 'medium' }: { size?: 'small' | 'medium' }) => {
  const { currentResume, updateResumeField, templates } = useResumeStore();

  if (!currentResume) {
    return null;
  }

  return (
    <FormControl fullWidth={size === 'medium'} size={size}>
      <InputLabel id="template-select-label">Template</InputLabel>
      <Select
        labelId="template-select-label"
        id="template-select"
        value={currentResume.templateId}
        label="Template"
        onChange={(e) => updateResumeField('templateId', e.target.value)}
      >
        {templates.map((template) => (
          <MenuItem key={template.id} value={template.id}>
            {template.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
