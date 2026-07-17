import{f as b,j as i,a5 as Y}from"./index-Dpx_WT6y.js";import{F as W,c as Z,b as z}from"./listExportUtils-hjHQws6G.js";import{B as H}from"./Button-CvsONnu0.js";const st=({columns:p,data:A,filteredData:S,searchTerm:$,highlightText:E,selectAll:I,selectedItems:u,handleSelectAllChange:L,handleCheckboxChange:M,handleEdit:v,handleDelete:m,handleDeleteSelected:B,rowsPerPage:h,page:f,handleChangePage:P,handleChangeRowsPerPage:O,expandedRows:T,toggleRowExpansion:F,renderExpandedRow:D,renderCustomActions:j,uiVariant:_="default",externalPagination:X=!1,paginationComponent:q=null,forceHorizontalScroll:n=!1})=>{const x=v||m||j,g=S||A||[],[r,G]=b.useState(window.innerWidth<768),[d,J]=b.useState(0),e=_==="app",l=b.useRef(null),o=50,a=n?92:80,C=t=>Number(t.width||t.minWidth||140),k=p.reduce((t,s)=>t+C(s),0),N=o+(x?a:0),y=N+k,w=e&&d>0&&(n||r)&&y>d,R=e&&n?y:e&&d>0?w?y:d:y,K=e&&d>0&&!w?Math.max(d-N,0):k,c=t=>{const s=C(t);return!e||n||w||d<=0||k<=0?s:s/k*K};b.useEffect(()=>{const t=()=>{G(window.innerWidth<768),l.current&&J(l.current.clientWidth||0)};t();let s;return typeof ResizeObserver<"u"&&l.current&&(s=new ResizeObserver(t),s.observe(l.current)),window.addEventListener("resize",t),()=>{window.removeEventListener("resize",t),s&&s.disconnect()}},[]),b.useEffect(()=>{if(l.current&&r){const t=l.current;setTimeout(()=>{t.scrollLeft=t.scrollWidth-t.clientWidth},100)}},[r,g]);const Q=e?{backgroundColor:"white",borderRadius:0,padding:0,margin:0,width:"100%",maxWidth:"100%",minWidth:0}:{boxShadow:"0 0 15px rgba(0, 0, 0, 0.1)",backgroundColor:"white",borderRadius:"8px",padding:"15px",margin:"10px 0",width:"100%"},U=e?"app-table":void 0,V=e?"sticky-table-container app-table-scroll":"sticky-table-container";return i.jsxs("div",{className:`expand-table-container ${e?"app-expand-table":""}`,style:Q,children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
        .sticky-table-container {
          -webkit-overflow-scrolling: touch !important;
        }
        .sticky-left {
          position: sticky;
          left: 0;
          z-index: 2;
          background-color: white;
        }
        .sticky-right {
          position: sticky;
          right: 0;
          z-index: 2;
          background-color: white;
        }
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 2;
          background-color: #00afaa;
          color: white;
        }
        .sticky-header-left {
          position: sticky;
          left: 0;
          top: 0;
          z-index: 3;
          background-color: #00afaa;
          color: white;
        }
        .sticky-header-right {
          position: sticky;
          right: 0;
          top: 0;
          z-index: 3;
          background-color: #00afaa;
          color: white;
        }
        .sticky-header-right.status-header {
          right: 80px;
        }
        .sticky-right.status-cell {
          right: 80px;
        }
        @media (max-width: 768px) {
          .sticky-shadow-right {
            box-shadow: -5px 0 10px -5px rgba(0,0,0,0.3);
          }
          .sticky-shadow-left {
            box-shadow: 5px 0 10px -5px rgba(0,0,0,0.3);
          }
        }
      `}}),i.jsx("div",{ref:l,className:V,style:{width:"100%",overflowX:e?n||w?"auto":"hidden":"auto",position:"relative"},children:i.jsxs("table",{className:U,style:{width:e&&(n||d>0)?`${R}px`:"100%",minWidth:e&&(n||d>0)?`${R}px`:r?`${y}px`:"100%",tableLayout:e?"fixed":"auto",borderCollapse:e?"collapse":"separate",borderSpacing:0},children:[e&&i.jsxs("colgroup",{children:[i.jsx("col",{style:{width:`${o}px`}}),p.map(t=>i.jsx("col",{style:{width:`${c(t)}px`}},`col-${t.key}`)),x&&i.jsx("col",{style:{width:`${a}px`}})]}),i.jsx("thead",{children:i.jsxs("tr",{children:[i.jsx("th",{className:"sticky-header-left sticky-shadow-left",style:{width:`${o}px`,minWidth:`${o}px`,maxWidth:`${o}px`,padding:e?"8px":"10px",textAlign:"center",borderColor:e?"#00afaa":void 0},children:i.jsx("input",{type:"checkbox",checked:I,onChange:L,"aria-label":"Select all rows"})}),p.map(t=>i.jsx("th",{className:`sticky-header ${t.stickyRight?"sticky-column-right sticky-shadow-right":""}`.trim(),style:{width:e?`${c(t)}px`:void 0,minWidth:e?`${c(t)}px`:t.minWidth||"120px",maxWidth:e?`${c(t)}px`:void 0,padding:e?"8px":"10px",textAlign:e?"center":"left",fontWeight:"bold",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderColor:e?"#00afaa":void 0,...t.stickyRight?{position:"sticky",right:`${t.stickyRightOffset??a}px`,zIndex:3,backgroundColor:"#00afaa"}:{}},children:t.label},t.key)),x&&i.jsx("th",{className:"sticky-header-right sticky-shadow-right",style:{width:`${a}px`,minWidth:`${a}px`,maxWidth:`${a}px`,padding:e?"8px":"10px",textAlign:"center",right:0,zIndex:4},children:"Action"})]})}),i.jsxs("tbody",{children:[(X?g:g.slice(f*h,f*h+h)).map(t=>i.jsxs(Y.Fragment,{children:[i.jsxs("tr",{children:[i.jsx("td",{className:"sticky-left sticky-shadow-left",style:{width:`${o}px`,minWidth:`${o}px`,maxWidth:`${o}px`,padding:"8px",borderBottom:"1px solid #eee",textAlign:"center"},children:i.jsx("input",{type:"checkbox",checked:u.includes(t.id),onChange:()=>M(t.id),"aria-label":`Select row ${t.id}`})}),p.map(s=>i.jsx("td",{className:s.stickyRight?"sticky-column-right sticky-shadow-right":void 0,style:{width:e?`${c(s)}px`:void 0,minWidth:e?`${c(s)}px`:void 0,maxWidth:e?`${c(s)}px`:void 0,backgroundColor:"white",padding:"8px",borderBottom:"1px solid #eee",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:e?"center":"left",...s.stickyRight?{position:"sticky",right:`${s.stickyRightOffset??a}px`,zIndex:2,backgroundColor:"white"}:{}},children:s.render?s.render(t,$,F):E(t[s.key],$)||""},`${t.id}-${s.key}`)),x&&i.jsx("td",{className:"sticky-right sticky-shadow-right",style:{width:`${a}px`,minWidth:`${a}px`,maxWidth:`${a}px`,padding:"8px",borderBottom:"1px solid #eee",textAlign:"center",right:0,zIndex:3,backgroundColor:"white"},children:i.jsxs("div",{className:"app-table-actions",style:n?{gap:"12px",flexWrap:"nowrap"}:void 0,children:[v&&i.jsx(W,{onClick:()=>v(t),icon:Z,className:e?"app-table-action is-edit":void 0,style:e?void 0:{color:"#007bff",cursor:"pointer",fontSize:"16px"},"aria-label":"Edit"}),m&&i.jsx(W,{onClick:()=>m(t.id),icon:z,className:e?"app-table-action is-delete":void 0,style:e?void 0:{color:"#ff0000",cursor:"pointer",fontSize:"16px"},"aria-label":"Delete"}),j&&j(t)]})})]}),T[t.id]&&i.jsx("tr",{className:"expanded-row",children:i.jsx("td",{colSpan:p.length+1+(x?1:0),style:{padding:"15px",backgroundColor:"#f9f9f9",borderBottom:"1px solid #eee"},children:D(t)})})]},t.id||`row-${Math.random()}`)),g.length===0&&i.jsx("tr",{children:i.jsx("td",{colSpan:p.length+1+(x?1:0),style:{textAlign:"center",padding:"20px"},children:"Aucune donnee disponible"})})]})]})}),i.jsxs("div",{className:e?"app-table-footer":void 0,style:e?void 0:{display:"flex",flexDirection:r?"column":"row",justifyContent:"space-between",alignItems:r?"flex-start":"center",marginTop:"20px",gap:"15px"},children:[i.jsx(H,{variant:"contained",color:"error",onClick:B,disabled:!u||u.length===0,className:e?"app-danger-button":void 0,style:e?void 0:{borderRadius:"8px",fontWeight:"bold",padding:"8px 16px",backgroundColor:"#dc3545",fontSize:r?"12px":"14px"},startIcon:i.jsx(W,{icon:z}),children:"Supprimer selection"}),q||i.jsxs("div",{className:e?"app-table-pagination":void 0,style:e?void 0:{display:"flex",alignItems:"center",gap:"10px"},children:[i.jsx("span",{children:"Lignes par page:"}),i.jsx("select",{value:h,onChange:t=>O({target:{value:t.target.value}}),style:e?void 0:{marginRight:"15px",padding:"5px"},children:[5,10,15,20,25].map(t=>i.jsx("option",{value:t,children:t},t))}),i.jsx("span",{children:`${f*h+1}-${Math.min((f+1)*h,g.length)} sur ${g.length}`})]})]})]})};export{st as E};
