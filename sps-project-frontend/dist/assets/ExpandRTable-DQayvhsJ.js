import{f as b,j as i,a5 as U}from"./index-WA2Udh33.js";import{F as j,b as V,c as S}from"./style-zl87elT9.js";import{B as Y}from"./Button-Cijj-cZk.js";const it=({columns:c,data:z,filteredData:R,searchTerm:W,highlightText:A,selectAll:E,selectedItems:k,handleSelectAllChange:L,handleCheckboxChange:M,handleEdit:u,handleDelete:m,handleDeleteSelected:B,rowsPerPage:p,page:g,handleChangePage:Z,handleChangeRowsPerPage:T,expandedRows:I,toggleRowExpansion:O,renderExpandedRow:F,renderCustomActions:v,uiVariant:D="default",externalPagination:H=!1,paginationComponent:_=null})=>{const h=u||m||v,x=R||z||[],[d,X]=b.useState(window.innerWidth<768),[o,q]=b.useState(0),e=D==="app",r=b.useRef(null),s=50,n=80,$=t=>Number(t.width||t.minWidth||140),f=c.reduce((t,a)=>t+$(a),0),C=s+(h?n:0),y=C+f,w=e&&d&&o>0&&y>o,N=e&&o>0?w?y:o:y,G=e&&o>0&&!w?Math.max(o-C,0):f,l=t=>{const a=$(t);return!e||w||o<=0||f<=0?a:a/f*G};b.useEffect(()=>{const t=()=>{X(window.innerWidth<768),r.current&&q(r.current.clientWidth||0)};t();let a;return typeof ResizeObserver<"u"&&r.current&&(a=new ResizeObserver(t),a.observe(r.current)),window.addEventListener("resize",t),()=>{window.removeEventListener("resize",t),a&&a.disconnect()}},[]),b.useEffect(()=>{if(r.current&&d){const t=r.current;setTimeout(()=>{t.scrollLeft=t.scrollWidth-t.clientWidth},100)}},[d,x]);const J=e?{backgroundColor:"white",borderRadius:0,padding:0,margin:0,width:"100%",maxWidth:"100%",minWidth:0}:{boxShadow:"0 0 15px rgba(0, 0, 0, 0.1)",backgroundColor:"white",borderRadius:"8px",padding:"15px",margin:"10px 0",width:"100%"},K=e?"app-table":void 0,Q=e?"sticky-table-container app-table-scroll":"sticky-table-container";return i.jsxs("div",{className:`expand-table-container ${e?"app-expand-table":""}`,style:J,children:[i.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
      `}}),i.jsx("div",{ref:r,className:Q,style:{width:"100%",overflowX:e?w?"auto":"hidden":"auto",position:"relative"},children:i.jsxs("table",{className:K,style:{width:e&&o>0?`${N}px`:"100%",minWidth:e&&o>0?`${N}px`:d?`${y}px`:"100%",tableLayout:e?"fixed":"auto",borderCollapse:e?"collapse":"separate",borderSpacing:0},children:[e&&i.jsxs("colgroup",{children:[i.jsx("col",{style:{width:`${s}px`}}),c.map(t=>i.jsx("col",{style:{width:`${l(t)}px`}},`col-${t.key}`)),h&&i.jsx("col",{style:{width:`${n}px`}})]}),i.jsx("thead",{children:i.jsxs("tr",{children:[i.jsx("th",{className:"sticky-header-left sticky-shadow-left",style:{width:`${s}px`,minWidth:`${s}px`,maxWidth:`${s}px`,padding:e?"8px":"10px",textAlign:"center",borderColor:e?"#00afaa":void 0},children:i.jsx("input",{type:"checkbox",checked:E,onChange:L,"aria-label":"Select all rows"})}),c.map(t=>i.jsx("th",{className:"sticky-header",style:{width:e?`${l(t)}px`:void 0,minWidth:e?`${l(t)}px`:t.minWidth||"120px",maxWidth:e?`${l(t)}px`:void 0,padding:e?"8px":"10px",textAlign:e?"center":"left",fontWeight:"bold",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderColor:e?"#00afaa":void 0},children:t.label},t.key)),h&&i.jsx("th",{className:"sticky-header-right sticky-shadow-right",style:{width:`${n}px`,minWidth:`${n}px`,maxWidth:`${n}px`,padding:e?"8px":"10px",textAlign:"center"},children:"Action"})]})}),i.jsxs("tbody",{children:[(H?x:x.slice(g*p,g*p+p)).map(t=>i.jsxs(U.Fragment,{children:[i.jsxs("tr",{children:[i.jsx("td",{className:"sticky-left sticky-shadow-left",style:{width:`${s}px`,minWidth:`${s}px`,maxWidth:`${s}px`,padding:"8px",borderBottom:"1px solid #eee",textAlign:"center"},children:i.jsx("input",{type:"checkbox",checked:k.includes(t.id),onChange:()=>M(t.id),"aria-label":`Select row ${t.id}`})}),c.map(a=>i.jsx("td",{style:{width:e?`${l(a)}px`:void 0,minWidth:e?`${l(a)}px`:void 0,maxWidth:e?`${l(a)}px`:void 0,backgroundColor:"white",padding:"8px",borderBottom:"1px solid #eee",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:e?"center":"left"},children:a.render?a.render(t,W,O):A(t[a.key],W)||""},`${t.id}-${a.key}`)),h&&i.jsx("td",{className:"sticky-right sticky-shadow-right",style:{width:`${n}px`,minWidth:`${n}px`,maxWidth:`${n}px`,padding:"8px",borderBottom:"1px solid #eee",textAlign:"center"},children:i.jsxs("div",{className:"app-table-actions",children:[u&&i.jsx(j,{onClick:()=>u(t),icon:V,className:e?"app-table-action is-edit":void 0,style:e?void 0:{color:"#007bff",cursor:"pointer",fontSize:"16px"},"aria-label":"Edit"}),m&&i.jsx(j,{onClick:()=>m(t.id),icon:S,className:e?"app-table-action is-delete":void 0,style:e?void 0:{color:"#ff0000",cursor:"pointer",fontSize:"16px"},"aria-label":"Delete"}),v&&v(t)]})})]}),I[t.id]&&i.jsx("tr",{className:"expanded-row",children:i.jsx("td",{colSpan:c.length+1+(h?1:0),style:{padding:"15px",backgroundColor:"#f9f9f9",borderBottom:"1px solid #eee"},children:F(t)})})]},t.id||`row-${Math.random()}`)),x.length===0&&i.jsx("tr",{children:i.jsx("td",{colSpan:c.length+1+(h?1:0),style:{textAlign:"center",padding:"20px"},children:"Aucune donnee disponible"})})]})]})}),i.jsxs("div",{className:e?"app-table-footer":void 0,style:e?void 0:{display:"flex",flexDirection:d?"column":"row",justifyContent:"space-between",alignItems:d?"flex-start":"center",marginTop:"20px",gap:"15px"},children:[i.jsx(Y,{variant:"contained",color:"error",onClick:B,disabled:!k||k.length===0,className:e?"app-danger-button":void 0,style:e?void 0:{borderRadius:"8px",fontWeight:"bold",padding:"8px 16px",backgroundColor:"#dc3545",fontSize:d?"12px":"14px"},startIcon:i.jsx(j,{icon:S}),children:"Supprimer selection"}),_||i.jsxs("div",{className:e?"app-table-pagination":void 0,style:e?void 0:{display:"flex",alignItems:"center",gap:"10px"},children:[i.jsx("span",{children:"Lignes par page:"}),i.jsx("select",{value:p,onChange:t=>T({target:{value:t.target.value}}),style:e?void 0:{marginRight:"15px",padding:"5px"},children:[5,10,15,20,25].map(t=>i.jsx("option",{value:t,children:t},t))}),i.jsx("span",{children:`${g*p+1}-${Math.min((g+1)*p,x.length)} sur ${x.length}`})]})]})]})};export{it as E};
