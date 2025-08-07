import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
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
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  Cog6ToothIcon,
  PencilIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/Loading';
import { formAPI } from '../../lib/api';

// Field type definitions
const FIELD_TYPES = {
  text: {
    name: 'Text Input',
    icon: '📝',
    component: 'TextInput',
    settings: ['label', 'placeholder', 'required', 'description'],
  },
  email: {
    name: 'Email',
    icon: '📧',
    component: 'EmailInput',
    settings: ['label', 'placeholder', 'required', 'description'],
  },
  number: {
    name: 'Number',
    icon: '🔢',
    component: 'NumberInput',
    settings: ['label', 'placeholder', 'required', 'min', 'max', 'description'],
  },
  textarea: {
    name: 'Long Text',
    icon: '📄',
    component: 'TextArea',
    settings: ['label', 'placeholder', 'required', 'rows', 'description'],
  },
  select: {
    name: 'Dropdown',
    icon: '📋',
    component: 'Select',
    settings: ['label', 'required', 'options', 'description'],
  },
  radio: {
    name: 'Multiple Choice',
    icon: '⚪',
    component: 'RadioGroup',
    settings: ['label', 'required', 'options', 'description'],
  },
  checkbox: {
    name: 'Checkboxes',
    icon: '☑️',
    component: 'CheckboxGroup',
    settings: ['label', 'required', 'options', 'description'],
  },
  rating: {
    name: 'Rating',
    icon: '⭐',
    component: 'Rating',
    settings: ['label', 'required', 'maxRating', 'description'],
  },
  date: {
    name: 'Date',
    icon: '📅',
    component: 'DateInput',
    settings: ['label', 'required', 'description'],
  },
  file: {
    name: 'File Upload',
    icon: '📎',
    component: 'FileUpload',
    settings: ['label', 'required', 'allowedTypes', 'maxSize', 'description'],
  },
};

const FormBuilder = () => {
  const [formData, setFormData] = useState({
    title: 'Untitled Form',
    description: '',
    fields: [],
    settings: {
      allowAnonymous: true,
      requireAuth: false,
      maxResponses: null,
      expiresAt: null,
    },
  });
  const [selectedField, setSelectedField] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const formId = new URLSearchParams(window.location.search).get('id');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const response = await formAPI.getForm(formId);
      const form = response.data.data;
      setFormData({
        title: form.title,
        description: form.description || '',
        fields: form.fields || [],
        settings: form.settings || {
          allowAnonymous: true,
          requireAuth: false,
          maxResponses: null,
          expiresAt: null,
        },
      });
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFormData(prev => {
        const oldIndex = prev.fields.findIndex(field => field.id === active.id);
        const newIndex = prev.fields.findIndex(field => field.id === over.id);

        return {
          ...prev,
          fields: arrayMove(prev.fields, oldIndex, newIndex),
        };
      });
    }
  };

  const addField = (fieldType) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: fieldType,
      label: FIELD_TYPES[fieldType].name,
      required: false,
      settings: {},
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));

    setSelectedField(newField);
  };

  const updateField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));

    if (selectedField?.id === fieldId) {
      setSelectedField(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId),
    }));

    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const duplicateField = (fieldId) => {
    const fieldToDuplicate = formData.fields.find(field => field.id === fieldId);
    if (fieldToDuplicate) {
      const duplicatedField = {
        ...fieldToDuplicate,
        id: `field_${Date.now()}`,
        label: `${fieldToDuplicate.label} (Copy)`,
      };

      const fieldIndex = formData.fields.findIndex(field => field.id === fieldId);
      const newFields = [...formData.fields];
      newFields.splice(fieldIndex + 1, 0, duplicatedField);

      setFormData(prev => ({
        ...prev,
        fields: newFields,
      }));
    }
  };

  const saveForm = async () => {
    try {
      setSaving(true);
      if (formId) {
        await formAPI.updateForm(formId, formData);
      } else {
        const response = await formAPI.createForm(formData);
        window.history.replaceState(null, '', `?id=${response.data.data.id}`);
      }
      // Show success message
    } catch (error) {
      console.error('Error saving form:', error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner.Page />;
  }

  return (
    <div className="h-full flex">
      {/* Field Palette */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-medium text-gray-900 mb-4">Add Fields</h3>
        <div className="space-y-2">
          {Object.entries(FIELD_TYPES).map(([type, config]) => (
            <button
              key={type}
              onClick={() => addField(type)}
              className="w-full flex items-center p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <span className="text-lg mr-3">{config.icon}</span>
              <span className="text-sm font-medium text-gray-700">{config.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Builder */}
      <div className="flex-1 flex">
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-bold border-none p-0 focus:ring-0"
                placeholder="Form Title"
              />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Form description (optional)"
                className="mt-2 w-full text-gray-600 border-none resize-none focus:ring-0 p-0"
                rows={2}
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button onClick={saveForm} loading={saving}>
                {formId ? 'Update Form' : 'Save Form'}
              </Button>
            </div>
          </div>

          {/* Form Canvas */}
          <Card className="min-h-96">
            <Card.Content className="p-6">
              {previewMode ? (
                <FormPreview formData={formData} />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.fields.map(field => field.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="min-h-64">
                      {formData.fields.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <PlusIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No fields yet. Drag fields from the sidebar to get started.</p>
                        </div>
                      ) : (
                        formData.fields.map((field) => (
                          <SortableFieldEditor
                            key={field.id}
                            field={field}
                            isSelected={selectedField?.id === field.id}
                            onSelect={() => setSelectedField(field)}
                            onUpdate={(updates) => updateField(field.id, updates)}
                            onDelete={() => deleteField(field.id)}
                            onDuplicate={() => duplicateField(field.id)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Field Settings Panel */}
        {selectedField && !previewMode && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
            <FieldSettings
              field={selectedField}
              onUpdate={(updates) => updateField(selectedField.id, updates)}
              onClose={() => setSelectedField(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Sortable Field Editor Component
const SortableFieldEditor = ({ field, isSelected, onSelect, onUpdate, onDelete, onDuplicate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border-2 rounded-lg p-4 cursor-pointer transition-all mb-4 ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 cursor-move"
      >
        <Bars3Icon className="h-4 w-4 text-gray-400" />
      </div>

      {/* Field Actions */}
      <div className="absolute right-2 top-2 flex space-x-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-400 hover:text-red-600"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Field Preview */}
      <div className="mr-16 ml-8">
        <FieldPreview field={field} />
      </div>
    </div>
  );
};

// Field Editor Component
const FieldEditor = ({ field, isSelected, onSelect, onUpdate, onDelete, onDuplicate, dragHandleProps }) => {
  return (
    <div
      className={`relative group border-2 rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 cursor-move"
      >
        <Bars3Icon className="h-4 w-4 text-gray-400" />
      </div>

      {/* Field Actions */}
      <div className="absolute right-2 top-2 flex space-x-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-400 hover:text-red-600"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Field Preview */}
      <div className="mr-16 ml-8">
        <FieldPreview field={field} />
      </div>
    </div>
  );
};

// Field Preview Component
const FieldPreview = ({ field }) => {
  const renderPreview = () => {
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            placeholder={field.settings.placeholder || 'Enter text...'}
            disabled
            className="bg-gray-50"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.settings.placeholder || 'Enter number...'}
            disabled
            className="bg-gray-50"
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.settings.placeholder || 'Enter long text...'}
            rows={field.settings.rows || 3}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        );
      case 'select':
        return (
          <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
            <option>Select an option...</option>
            {(field.settings.options || []).map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {(field.settings.options || ['Option 1', 'Option 2']).map((option, index) => (
              <label key={index} className="flex items-center">
                <input type="radio" disabled className="mr-2" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {(field.settings.options || ['Option 1', 'Option 2']).map((option, index) => (
              <label key={index} className="flex items-center">
                <input type="checkbox" disabled className="mr-2" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'rating':
        return (
          <div className="flex space-x-1">
            {Array.from({ length: field.settings.maxRating || 5 }).map((_, index) => (
              <span key={index} className="text-gray-300 text-xl">⭐</span>
            ))}
          </div>
        );
      case 'date':
        return (
          <Input
            type="date"
            disabled
            className="bg-gray-50"
          />
        );
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
            <span className="text-gray-500">Click to upload file</span>
          </div>
        );
      default:
        return <div className="text-gray-500">Unknown field type</div>;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderPreview()}
      {field.settings.description && (
        <p className="mt-1 text-xs text-gray-500">{field.settings.description}</p>
      )}
    </div>
  );
};

// Field Settings Component
const FieldSettings = ({ field, onUpdate, onClose }) => {
  const fieldType = FIELD_TYPES[field.type];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Field Settings</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        {fieldType.settings.includes('label') && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Label
            </label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field label"
            />
          </div>
        )}

        {/* Required */}
        {fieldType.settings.includes('required') && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs font-medium text-gray-700">Required field</span>
            </label>
          </div>
        )}

        {/* Placeholder */}
        {fieldType.settings.includes('placeholder') && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <Input
              value={field.settings.placeholder || ''}
              onChange={(e) => onUpdate({
                settings: { ...field.settings, placeholder: e.target.value }
              })}
              placeholder="Placeholder text"
            />
          </div>
        )}

        {/* Description */}
        {fieldType.settings.includes('description') && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={field.settings.description || ''}
              onChange={(e) => onUpdate({
                settings: { ...field.settings, description: e.target.value }
              })}
              placeholder="Help text for this field"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
        )}

        {/* Options (for select, radio, checkbox) */}
        {fieldType.settings.includes('options') && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Options
            </label>
            <OptionsEditor
              options={field.settings.options || []}
              onChange={(options) => onUpdate({
                settings: { ...field.settings, options }
              })}
            />
          </div>
        )}

        {/* Min/Max for number fields */}
        {fieldType.settings.includes('min') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Value
              </label>
              <Input
                type="number"
                value={field.settings.min || ''}
                onChange={(e) => onUpdate({
                  settings: { ...field.settings, min: e.target.value }
                })}
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Value
              </label>
              <Input
                type="number"
                value={field.settings.max || ''}
                onChange={(e) => onUpdate({
                  settings: { ...field.settings, max: e.target.value }
                })}
                placeholder="Max"
              />
            </div>
          </div>
        )}

        {/* Rows for textarea */}
        {fieldType.settings.includes('rows') && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Rows
            </label>
            <Input
              type="number"
              value={field.settings.rows || 3}
              onChange={(e) => onUpdate({
                settings: { ...field.settings, rows: parseInt(e.target.value) || 3 }
              })}
              min="1"
              max="10"
            />
          </div>
        )}

        {/* Max Rating */}
        {fieldType.settings.includes('maxRating') && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Max Rating
            </label>
            <select
              value={field.settings.maxRating || 5}
              onChange={(e) => onUpdate({
                settings: { ...field.settings, maxRating: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              {[3, 4, 5, 7, 10].map(num => (
                <option key={num} value={num}>{num} Stars</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

// Options Editor Component
const OptionsEditor = ({ options, onChange }) => {
  const [optionsList, setOptionsList] = useState(options.length > 0 ? options : ['']);

  useEffect(() => {
    const filteredOptions = optionsList.filter(option => option.trim());
    onChange(filteredOptions);
  }, [optionsList, onChange]);

  const updateOption = (index, value) => {
    const newOptions = [...optionsList];
    newOptions[index] = value;
    setOptionsList(newOptions);
  };

  const addOption = () => {
    setOptionsList([...optionsList, '']);
  };

  const removeOption = (index) => {
    const newOptions = optionsList.filter((_, i) => i !== index);
    setOptionsList(newOptions);
  };

  return (
    <div className="space-y-2">
      {optionsList.map((option, index) => (
        <div key={index} className="flex space-x-2">
          <Input
            value={option}
            onChange={(e) => updateOption(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="flex-1"
          />
          {optionsList.length > 1 && (
            <button
              onClick={() => removeOption(index)}
              className="p-2 text-gray-400 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addOption} className="w-full">
        <PlusIcon className="h-4 w-4 mr-1" />
        Add Option
      </Button>
    </div>
  );
};

// Form Preview Component
const FormPreview = ({ formData }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{formData.title}</h1>
        {formData.description && (
          <p className="mt-2 text-gray-600">{formData.description}</p>
        )}
      </div>

      <form className="space-y-6">
        {formData.fields.map((field) => (
          <div key={field.id}>
            <FieldPreview field={field} />
          </div>
        ))}

        {formData.fields.length > 0 && (
          <div className="pt-6">
            <Button className="w-full" disabled>
              Submit Form
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default FormBuilder;
