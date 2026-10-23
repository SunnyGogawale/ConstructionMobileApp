import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { apiRequest } from "../../shared/api.js";
import { displayMoney, displayDate, displayDateTime } from "../../shared/formatters.js";
import { ProjectDeleteDialog } from "./ProjectDialogs.jsx";
export function SubtaskMaterials({
  projectId,
  subtask,
  token,
  role,
  user,
  notify,
  isAddOpen,
  onFormClose
}) {
  const canManage = role === "admin" || role === "project_manager";
  const encodedProjectId = encodeURIComponent(projectId);
  const encodedSubtaskId = encodeURIComponent(subtask._id);
  const materialsPath = `/api/projects/${encodedProjectId}/subtasks/${encodedSubtaskId}/materials`;
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [materialDetails, setMaterialDetails] = useState(null);
  const detailsRequestRef = useRef(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [todayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  const materialBeingEdited = editingMaterial || (isAddOpen ? {} : null);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest(materialsPath, token, {
      signal: controller.signal
    }).then(result => {
      setMaterials(result.materials || []);
      setLoadError("");
    }).catch(error => {
      if (error.name !== "AbortError") setLoadError(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [materialsPath, token]);
  useLayoutEffect(() => {
    if (!openMenuId) return undefined;
    const positionMenu = () => {
      const button = menuButtonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;
      const margin = 8;
      const buttonRect = button.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom - margin;
      const spaceAbove = buttonRect.top - margin;
      const below = spaceBelow >= menuRect.height || spaceBelow >= spaceAbove;
      const top = below ? Math.min(buttonRect.bottom + 4, window.innerHeight - menuRect.height - margin) : Math.max(margin, buttonRect.top - menuRect.height - 4);
      const left = Math.max(margin, Math.min(buttonRect.right - menuRect.width, window.innerWidth - menuRect.width - margin));
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
      menu.style.visibility = "visible";
    };
    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [openMenuId]);
  useEffect(() => {
    if (!openMenuId) return undefined;
    const closeMenu = event => {
      if (event.type === "keydown" && event.key === "Escape") {
        setOpenMenuId(null);
        return;
      }
      if (!menuRef.current?.contains(event.target) && !menuButtonRef.current?.contains(event.target)) setOpenMenuId(null);
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [openMenuId]);
  function openMaterialForm(material = {}) {
    setEditingMaterial(material);
    setQuantity(material.quantity == null ? "" : String(material.quantity));
    setUnitPrice(material.unitPrice == null ? "" : String(material.unitPrice));
  }
  async function saveMaterial(event) {
    event.preventDefault();
    if (!canManage || saving) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name")?.toString().trim(),
      description: form.get("description")?.toString() || "",
      quantity: Number(quantity),
      unit: form.get("unit")?.toString().trim(),
      unitPrice: Number(unitPrice),
      date: form.get("date")?.toString(),
      notes: form.get("notes")?.toString() || ""
    };
    setSaving(true);
    try {
      const isEditing = Boolean(editingMaterial?._id);
      const path = isEditing ? `${materialsPath}/${encodeURIComponent(editingMaterial._id)}` : materialsPath;
      const {
        material
      } = await apiRequest(path, token, {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      setMaterials(current => isEditing ? current.map(item => item._id === material._id ? material : item) : [material, ...current]);
      setEditingMaterial(null);
      onFormClose?.();
      notify(isEditing ? "Subtask material updated." : "Subtask material added.");
    } catch (error) {
      notify(error.message);
    } finally {
      setSaving(false);
    }
  }
  async function deleteMaterial(material) {
    if (!canManage) return;
    try {
      await apiRequest(`${materialsPath}/${encodeURIComponent(material._id)}`, token, {
        method: "DELETE"
      });
      setMaterials(current => current.filter(item => item._id !== material._id));
      setDeleteCandidate(null);
      notify("Subtask material deleted.");
    } catch (error) {
      notify(error.message);
    }
  }
  async function showMaterialDetails(material) {
    const requestId = ++detailsRequestRef.current;
    setOpenMenuId(null);
    setMaterialDetails({
      loading: true,
      error: "",
      material: null,
      name: material.name
    });
    try {
      const result = await apiRequest(`${materialsPath}/${encodeURIComponent(material._id)}`, token);
      if (detailsRequestRef.current === requestId) setMaterialDetails({
        loading: false,
        error: "",
        material: result.material
      });
    } catch (error) {
      if (detailsRequestRef.current === requestId) setMaterialDetails({
        loading: false,
        error: error.message,
        material: null,
        name: material.name
      });
    }
  }
  function closeMaterialDetails() {
    detailsRequestRef.current += 1;
    setMaterialDetails(null);
  }
  function materialActorName(actor) {
    if (actor?.name) return actor.name;
    const actorId = actor?._id || actor;
    const userId = user?.id || user?._id;
    return actorId && userId && String(actorId) === String(userId) ? user.name : null;
  }
  const dateInputValue = value => value ? new Date(value).toISOString().slice(0, 10) : "";
  return <div className="subtask-materials">
      <div className="subtask-materials-heading">Materials <span>{materials.length}</span></div>
      {loadError && <div className="data-error" role="alert">{loadError}</div>}
      {loading ? <div className="loading-strip" role="status">Loading materials…</div> : materials.length ? <div className="subtask-material-list">{materials.map(material => <article className="subtask-material-row" key={material._id}>
            <div className="subtask-material-copy">
              <strong>{material.name}</strong>
              <span>{material.quantity} {material.unit} · {displayMoney(material.totalCost)} · {displayDate(material.date)}</span>
              {material.description && <p>{material.description}</p>}
              {material.notes && <small>Notes: {material.notes}</small>}
            </div>
            <button type="button" className="icon-button row-action" aria-label={`More actions for ${material.name}`} aria-haspopup="menu" aria-expanded={openMenuId === material._id} ref={element => {
          if (openMenuId === material._id) menuButtonRef.current = element;
        }} onClick={event => {
          if (openMenuId === material._id) setOpenMenuId(null);else {
            menuButtonRef.current = event.currentTarget;
            setOpenMenuId(material._id);
          }
        }}><MoreHorizontal size={18} /></button>
            {openMenuId === material._id && createPortal(<div className="project-row-menu" role="menu" ref={menuRef} style={{
          visibility: "hidden"
        }}>
                <button type="button" role="menuitem" onClick={() => showMaterialDetails(material)}><FileText size={15} aria-hidden="true" />Details</button>
                {canManage && <button type="button" role="menuitem" onClick={() => {
            setOpenMenuId(null);
            openMaterialForm(material);
          }}><Pencil size={15} aria-hidden="true" />Edit Material</button>}
                {canManage && <button type="button" role="menuitem" onClick={() => {
            setOpenMenuId(null);
            setDeleteCandidate(material);
          }}><Trash2 size={15} aria-hidden="true" />Delete Material</button>}
              </div>, document.body)}
          </article>)}</div> : <p className="subtask-material-empty">No materials recorded for this task.</p>}
      {materialBeingEdited !== null && canManage && createPortal(<div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && (setEditingMaterial(null), onFormClose?.())}>
          <form key={materialBeingEdited._id || "new-material"} className="dialog subtask-material-dialog" role="dialog" aria-modal="true" aria-labelledby="subtask-material-title" onSubmit={saveMaterial}>
            <div className="dialog-heading"><div><span className="eyebrow">SUBTASK MATERIAL</span><h2 id="subtask-material-title">{materialBeingEdited._id ? "Edit Material" : "Add Material"}</h2><p>{subtask.title}</p></div><button type="button" className="icon-button" aria-label="Close material form" onClick={() => {
            setEditingMaterial(null);
            onFormClose?.();
          }}><X size={18} /></button></div>
            <label>Material name<input name="name" required maxLength="180" defaultValue={materialBeingEdited.name || ""} /></label>
            <label>Description<textarea name="description" maxLength="3000" defaultValue={materialBeingEdited.description || ""} /></label>
            <div className="subtask-form-grid">
              <label>Quantity<input name="quantity" type="number" min="0.01" step="any" required value={quantity} onChange={event => setQuantity(event.target.value)} /></label>
              <label>Unit of measurement<input name="unit" required maxLength="80" defaultValue={materialBeingEdited.unit || ""} placeholder="e.g. bags, metres, kg" /></label>
              <label>Unit price<input name="unitPrice" type="number" min="0" step="0.01" required value={unitPrice} onChange={event => setUnitPrice(event.target.value)} /></label>
              <label>Date<input name="date" type="date" required defaultValue={dateInputValue(materialBeingEdited.date) || todayDate} /></label>
            </div>
            <p className="material-total-preview">Total cost <strong>{displayMoney((Number(quantity) || 0) * (Number(unitPrice) || 0))}</strong></p>
            <label>Notes (optional)<textarea name="notes" maxLength="2000" defaultValue={materialBeingEdited.notes || ""} /></label>
            <div className="subtask-form-actions">
              <button type="button" className="button button-secondary" disabled={saving} onClick={() => {
            setEditingMaterial(null);
            onFormClose?.();
          }}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={saving}>{saving ? "Saving…" : materialBeingEdited._id ? "Save changes" : "Save material"}</button>
            </div>
          </form>
        </div>, document.body)}
      {materialDetails && createPortal(<div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && closeMaterialDetails()}>
          <section className="dialog subtask-details-dialog" role="dialog" aria-modal="true" aria-labelledby="material-details-title">
            <div className="dialog-heading"><div><span className="eyebrow">SUBTASK MATERIAL</span><h2 id="material-details-title">{materialDetails.material?.name || materialDetails.name || "Material Details"}</h2><p>{materialDetails.material?.project?.name || "Project details"}</p></div><button type="button" className="icon-button" aria-label="Close material details" onClick={closeMaterialDetails}><X size={18} /></button></div>
            {materialDetails.loading ? <div className="loading-strip" role="status">Loading material details…</div> : materialDetails.error ? <div className="data-error" role="alert">{materialDetails.error}</div> : materialDetails.material && <>
                  <div className="subtask-details-meta">
                    <span>Description<strong>{materialDetails.material.description || "—"}</strong></span>
                    <span>Quantity<strong>{materialDetails.material.quantity} {materialDetails.material.unit}</strong></span>
                    <span>Unit of measurement<strong>{materialDetails.material.unit}</strong></span>
                    <span>Unit price<strong>{displayMoney(materialDetails.material.unitPrice)}</strong></span>
                    <span>Total cost<strong>{displayMoney(materialDetails.material.totalCost)}</strong></span>
                    <span>Date<strong>{displayDate(materialDetails.material.date)}</strong></span>
                    <span>Notes<strong>{materialDetails.material.notes || "—"}</strong></span>
                    <span>Associated project<strong>{materialDetails.material.project?.name || "Unknown"}</strong></span>
                    <span>Associated subtask<strong>{materialDetails.material.subtask?.title || "—"}</strong></span>
                    <span>Created by<strong>{materialActorName(materialDetails.material.createdBy) || "Unknown"}</strong></span>
                    <span>Created at<strong>{displayDateTime(materialDetails.material.createdAt)}</strong></span>
                    {materialActorName(materialDetails.material.updatedBy) && <span>Last updated by<strong>{materialActorName(materialDetails.material.updatedBy)}</strong></span>}
                    <span>Last updated at<strong>{displayDateTime(materialDetails.material.updatedAt)}</strong></span>
                  </div>
                  <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={closeMaterialDetails}>Close</button></div>
                </>}
          </section>
        </div>, document.body)}
      {deleteCandidate && canManage && createPortal(<ProjectDeleteDialog key={deleteCandidate._id} project={{
      name: deleteCandidate.name
    }} entityType="Material" impactMessage="This deletes only the material record. The project and task will be retained." onClose={() => setDeleteCandidate(null)} onConfirm={() => deleteMaterial(deleteCandidate)} />, document.body)}
    </div>;
}
