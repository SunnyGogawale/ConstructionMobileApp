import { useState } from "react";
import { Check, ChevronDown, CircleDollarSign, X } from "lucide-react";
import { managerList } from "../../shared/formatters.js";
import { recordDialogFields, pageTitles, recordDialogTitles } from "../../shared/config.js";
export function RecordDialog({
  page,
  role,
  editingUser,
  managerOptions,
  onClose,
  onResetPassword,
  onSubmit
}) {
  const [selectedRole, setSelectedRole] = useState(editingUser?.role || "worker");
  const currentManagers = managerList(editingUser?.managerMapping);
  const [selectedManagerIds, setSelectedManagerIds] = useState(() => currentManagers.map(manager => String(manager?._id || manager?.id || manager)).filter(Boolean));
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const fields = (recordDialogFields[page] || []).filter(field => !(editingUser && field.name === "password")).filter(field => !(editingUser && role !== "admin" && field.name === "role")).filter(field => field.name !== "managerMapping" || role === "admin" && selectedRole === "worker").map(field => {
    if (page !== "users" || field.name !== "role" || role === "admin") return field;
    return {
      ...field,
      options: field.options.filter(([value]) => value === "worker")
    };
  });
  const availableManagers = managerOptions || [];
  const managerOptionsForSelect = [...currentManagers, ...availableManagers.filter(manager => !currentManagers.some(current => String(current?._id || current?.id || current) === String(manager._id || manager.id)))];
  const selectedManagers = selectedManagerIds.map(id => managerOptionsForSelect.find(manager => String(manager?._id || manager?.id || manager) === id)).filter(Boolean);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="dialog record-dialog" role="dialog" aria-modal="true" aria-labelledby="record-dialog-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">{pageTitles[page]?.toUpperCase()}</span><h2 id="record-dialog-title">{editingUser ? "Edit team member" : recordDialogTitles[page]}</h2><p>{editingUser ? "Update this team member's account and manager mapping." : "Complete the details to add this record to the workspace."}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="record-fields">
            {fields.map(field => {
            const FieldWrapper = field.type === "manager" ? "div" : "label";
            return <FieldWrapper className={`${field.wide ? "record-field-wide " : ""}${field.type === "manager" ? "manager-field" : ""}`} key={field.name}>
                {field.type === "manager" ? <span className="manager-field-label">{field.label} <span aria-hidden="true">*</span></span> : field.label}
                {field.type === "manager" ? <div className="manager-multiselect" aria-required="true" aria-label="Manager Mapping, required">
                    <div className="manager-selection">
                      {selectedManagers.map(manager => {
                    const id = String(manager?._id || manager?.id || manager);
                    return <span className="manager-selection-chip" key={id}>
                            {manager.name || manager.email || "Project manager"}
                            <button type="button" aria-label={`Remove ${manager.name || manager.email} mapping`} onClick={() => setSelectedManagerIds(ids => ids.filter(selectedId => selectedId !== id))}><X size={13} /></button>
                          </span>;
                  })}
                      <button type="button" className="manager-dropdown-trigger" aria-haspopup="listbox" aria-expanded={managerDropdownOpen} onClick={() => setManagerDropdownOpen(open => !open)}>
                        {selectedManagers.length ? "Add a Project Manager" : "Select Project Managers"}
                        <ChevronDown size={15} />
                      </button>
                    </div>
                    {managerDropdownOpen && <div className="manager-dropdown-options" role="group" aria-label="Available Project Managers">
                        {managerOptionsForSelect.map(manager => {
                    const id = String(manager?._id || manager?.id || manager);
                    const selected = selectedManagerIds.includes(id);
                    return <button type="button" role="checkbox" aria-checked={selected} className="manager-dropdown-option" key={id} onClick={() => setSelectedManagerIds(ids => selected ? ids.filter(selectedId => selectedId !== id) : [...ids, id])}>
                              <span className={`manager-option-check ${selected ? "manager-option-selected" : ""}`} aria-hidden="true">{selected ? <Check size={12} /> : null}</span>
                              <span>{manager.name || manager.email} {manager.email && manager.name ? `(${manager.email})` : ""}</span>
                            </button>;
                  })}
                        {!managerOptionsForSelect.length && <span className="manager-dropdown-empty">No project managers available.</span>}
                      </div>}
                    {selectedManagerIds.map(id => <input key={id} type="hidden" name={field.name} value={id} />)}
                  </div> : field.type === "select" ? <select name={field.name} required={field.required} value={field.name === "role" ? selectedRole : undefined} defaultValue={field.name === "role" ? undefined : editingUser?.[field.name] || field.options?.[0]?.[0]} onChange={field.name === "role" ? event => setSelectedRole(event.target.value) : undefined}>
                    {field.options?.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select> : <input name={field.name} type={field.type || "text"} min={field.min} minLength={field.minLength} step={field.step} placeholder={field.placeholder} defaultValue={editingUser?.[field.name] ?? field.defaultValue} required={field.required} />}
              </FieldWrapper>;
          })}
          </div>
          {(page === "quotations" || page === "invoices") && <div className="record-note"><CircleDollarSign size={16} /><span>Subtotal combines labour, materials, and quantity × unit price. Tax and discount are then applied.</span></div>}
          <div className="dialog-actions">
            {editingUser && <button type="button" className="button button-secondary" onClick={() => onResetPassword?.(editingUser)}>Reset Password</button>}
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary"><Check size={16} />{editingUser ? "Save changes" : page === "users" ? "Send invite" : "Save record"}</button>
          </div>
        </form>
      </section>
    </div>;
}
