export { InputForm } from './input-form'
export { InputField } from './input-field'
export { InputApproval } from './input-approval'
export { InputSelection } from './input-selection'
export { InputUpload } from './input-upload'

// Import components for compound component
import { InputForm } from './input-form'
import { InputField } from './input-field'
import { InputApproval } from './input-approval'
import { InputSelection } from './input-selection'
import { InputUpload } from './input-upload'

// Main Input compound component
export const Input = {
  Form: InputForm,
  Field: InputField,
  Approval: InputApproval,
  Selection: InputSelection,
  Upload: InputUpload,
}