import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, MoreHorizontal } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge.jsx";
export function ProjectTable({
  projects,
  compact = false,
  onSelect,
  onStatusUpdate,
  onDeleteProject,
  onProjectRestore
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  useLayoutEffect(() => {
    if (!openMenuId) return undefined;
    const positionMenu = () => {
      const button = menuButtonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;
      const buttonRect = button.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const margin = 8;
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
  return <div className={`table-wrap ${compact ? "table-compact" : ""}`}>
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Manager</th>
            <th>Schedule</th>
            <th>Progress</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {projects.map(project => <tr key={project.id}>
              <td>
                <div className="project-cell">
                  <img src={project.image || "/buildflow.svg"} alt="" />
                  <div>
                    <strong>{project.name}</strong>
                    <span>
                      {project.id} · {project.client}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <span className="manager-cell">{project.manager}</span>
              </td>
              <td>
                <span className="date-cell">{project.dates}</span>
              </td>
              <td>
                <div className="table-progress">
                  <div>
                    <span style={{
                  width: `${project.progress}%`
                }} />
                  </div>
                  <b>{project.progress}%</b>
                </div>
              </td>
              <td>
                <StatusBadge>{project.status}</StatusBadge>
              </td>
              <td>
                {onStatusUpdate || onDeleteProject || onProjectRestore && project.hiddenByManagers?.length > 0 ? <div className="project-row-actions">
                    <button className="icon-button row-action" ref={element => {
                if (openMenuId === String(project._id || project.id)) menuButtonRef.current = element;
              }} aria-label={`More actions for ${project.name}`} aria-haspopup="menu" aria-expanded={openMenuId === String(project._id || project.id)} onClick={event => {
                const projectKey = String(project._id || project.id);
                if (openMenuId === projectKey) {
                  setOpenMenuId(null);
                } else {
                  menuButtonRef.current = event.currentTarget;
                  setOpenMenuId(projectKey);
                }
              }}>
                      <MoreHorizontal size={18} />
                    </button>
                    {openMenuId === String(project._id || project.id) && createPortal(<div ref={menuRef} className="project-row-menu" role="menu" style={{
                visibility: "hidden"
              }}>
                          <button type="button" role="menuitem" onClick={() => {
                  setOpenMenuId(null);
                  onSelect?.(project);
                }}><Building2 size={15} aria-hidden="true" />View project</button>
                          {onStatusUpdate && <button type="button" role="menuitem" onClick={() => {
                  setOpenMenuId(null);
                  onStatusUpdate(project);
                }}>Update Project Status</button>}
                          {onDeleteProject && <button type="button" role="menuitem" onClick={() => {
                  setOpenMenuId(null);
                  onDeleteProject(project);
                }}>Delete Project</button>}
                          {onProjectRestore && project.hiddenByManagers?.length > 0 && <button type="button" role="menuitem" onClick={() => {
                  setOpenMenuId(null);
                  onProjectRestore(project);
                }}>Restore visibility</button>}
                        </div>, document.body)}
                  </div> : <button className="icon-button row-action" aria-label={`More actions for ${project.name}`} onClick={() => onSelect?.(project)}>
                    <MoreHorizontal size={18} />
                  </button>}
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>;
}
