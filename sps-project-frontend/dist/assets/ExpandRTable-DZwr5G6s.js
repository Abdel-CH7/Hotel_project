import{f as k,j as e,a8 as tt}from"./index-C9tzjjhC.js";import{F as C,l as it,k as I}from"./index-DqNnDEkN.js";/* empty css              */import{B as et}from"./Button-DmxTio6C.js";const nt=({columns:h,data:L,filteredData:B,searchTerm:N,highlightText:M,selectAll:O,selectedItems:j,handleSelectAllChange:T,handleCheckboxChange:E,handleEdit:m,canEdit:R,handleDelete:W,handleDeleteSelected:F,rowsPerPage:x,page:w,handleChangePage:st,handleChangeRowsPerPage:D,expandedRows:_,toggleRowExpansion:X,renderExpandedRow:q,renderCustomActions:$,uiVariant:G="default",externalPagination:J=!1,paginationComponent:K=null,forceHorizontalScroll:r=!1,selectionEnabled:g=!0,showBulkDelete:Q=!0})=>{const y=m||W||$,b=B||L||[],[l,U]=k.useState(window.innerWidth<768),[o,V]=k.useState(0),i=G==="app",c=k.useRef(null),n=50,a=r?92:80,z=t=>Number(t.width||t.minWidth||140),u=h.reduce((t,s)=>t+z(s),0),A=(g?n:0)+(y?a:0),f=A+u,v=i&&o>0&&(r||l)&&f>o,S=i&&r?f:i&&o>0?v?f:o:f,Y=i&&o>0&&!v?Math.max(o-A,0):u,p=t=>{const s=z(t);return!i||r||v||o<=0||u<=0?s:s/u*Y};k.useEffect(()=>{const t=()=>{U(window.innerWidth<768),c.current&&V(c.current.clientWidth||0)};t();let s;return typeof ResizeObserver<"u"&&c.current&&(s=new ResizeObserver(t),s.observe(c.current)),window.addEventListener("resize",t),()=>{window.removeEventListener("resize",t),s&&s.disconnect()}},[]),k.useEffect(()=>{if(c.current&&l){const t=c.current;setTimeout(()=>{t.scrollLeft=t.scrollWidth-t.clientWidth},100)}},[l,b]);const Z=i?{backgroundColor:"white",borderRadius:0,padding:0,margin:0,width:"100%",maxWidth:"100%",minWidth:0}:{boxShadow:"0 0 15px rgba(0, 0, 0, 0.1)",backgroundColor:"white",borderRadius:"8px",padding:"15px",margin:"10px 0",width:"100%"},H=i?"app-table":void 0,P=i?"sticky-table-container app-table-scroll":"sticky-table-container";return e.jsxs("div",{className:`expand-table-container ${i?"app-expand-table":""}`,style:Z,children:[e.jsx("style",{dangerouslySetInnerHTML:{__html:`
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
      `}}),e.jsx("div",{ref:c,className:P,style:{width:"100%",overflowX:i?r||v?"auto":"hidden":"auto",position:"relative"},children:e.jsxs("table",{className:H,style:{width:i&&(r||o>0)?`${S}px`:"100%",minWidth:i&&(r||o>0)?`${S}px`:l?`${f}px`:"100%",tableLayout:i?"fixed":"auto",borderCollapse:i?"collapse":"separate",borderSpacing:0},children:[i&&e.jsxs("colgroup",{children:[g&&e.jsx("col",{style:{width:`${n}px`}}),h.map(t=>e.jsx("col",{style:{width:`${p(t)}px`}},`col-${t.key}`)),y&&e.jsx("col",{style:{width:`${a}px`}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[g&&e.jsx("th",{className:"sticky-header-left sticky-shadow-left",style:{width:`${n}px`,minWidth:`${n}px`,maxWidth:`${n}px`,padding:i?"8px":"10px",textAlign:"center",borderColor:i?"#00afaa":void 0},children:e.jsx("input",{type:"checkbox",checked:O,onChange:T,"aria-label":"Select all rows"})}),h.map(t=>e.jsx("th",{className:`sticky-header ${t.stickyRight?"sticky-column-right sticky-shadow-right":""}`.trim(),style:{width:i?`${p(t)}px`:void 0,minWidth:i?`${p(t)}px`:t.minWidth||"120px",maxWidth:i?`${p(t)}px`:void 0,padding:i?"8px":"10px",textAlign:i?"center":"left",fontWeight:"bold",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderColor:i?"#00afaa":void 0,...t.stickyRight?{position:"sticky",right:`${t.stickyRightOffset??a}px`,zIndex:3,backgroundColor:"#00afaa"}:{}},children:t.label},t.key)),y&&e.jsx("th",{className:"sticky-header-right sticky-shadow-right",style:{width:`${a}px`,minWidth:`${a}px`,maxWidth:`${a}px`,padding:i?"8px":"10px",textAlign:"center",right:0,zIndex:4},children:"Action"})]})}),e.jsxs("tbody",{children:[(J?b:b.slice(w*x,w*x+x)).map((t,s)=>e.jsxs(tt.Fragment,{children:[e.jsxs("tr",{children:[g&&e.jsx("td",{className:"sticky-left sticky-shadow-left",style:{width:`${n}px`,minWidth:`${n}px`,maxWidth:`${n}px`,padding:"8px",borderBottom:"1px solid #eee",textAlign:"center"},children:e.jsx("input",{type:"checkbox",checked:(j||[]).includes(t.id),onChange:()=>E(t.id),"aria-label":`Select row ${t.id}`})}),h.map(d=>e.jsx("td",{className:d.stickyRight?"sticky-column-right sticky-shadow-right":void 0,style:{width:i?`${p(d)}px`:void 0,minWidth:i?`${p(d)}px`:void 0,maxWidth:i?`${p(d)}px`:void 0,backgroundColor:"white",padding:"8px",borderBottom:"1px solid #eee",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:i?"center":"left",...d.stickyRight?{position:"sticky",right:`${d.stickyRightOffset??a}px`,zIndex:2,backgroundColor:"white"}:{}},children:d.render?d.render(t,N,X):M(t[d.key],N)||""},`${t.id}-${d.key}`)),y&&e.jsx("td",{className:"sticky-right sticky-shadow-right",style:{width:`${a}px`,minWidth:`${a}px`,maxWidth:`${a}px`,padding:"8px",borderBottom:"1px solid #eee",textAlign:"center",right:0,zIndex:3,backgroundColor:"white"},children:e.jsxs("div",{className:"app-table-actions",style:r?{gap:"12px",flexWrap:"nowrap"}:void 0,children:[m&&(!R||R(t))&&e.jsx(C,{onClick:()=>m(t),icon:it,className:i?"app-table-action is-edit":void 0,style:i?void 0:{color:"#007bff",cursor:"pointer",fontSize:"16px"},"aria-label":"Edit"}),W&&e.jsx(C,{onClick:()=>W(t.id),icon:I,className:i?"app-table-action is-delete":void 0,style:i?void 0:{color:"#ff0000",cursor:"pointer",fontSize:"16px"},"aria-label":"Delete"}),$&&$(t)]})})]}),_[t.id]&&e.jsx("tr",{className:"expanded-row",children:e.jsx("td",{colSpan:h.length+(g?1:0)+(y?1:0),style:{padding:"15px",backgroundColor:"#f9f9f9",borderBottom:"1px solid #eee"},children:q(t)})})]},t.id??`row-${s}`)),b.length===0&&e.jsx("tr",{children:e.jsx("td",{colSpan:h.length+(g?1:0)+(y?1:0),style:{textAlign:"center",padding:"20px"},children:"Aucune donnee disponible"})})]})]})}),e.jsxs("div",{className:i?"app-table-footer":void 0,style:i?void 0:{display:"flex",flexDirection:l?"column":"row",justifyContent:"space-between",alignItems:l?"flex-start":"center",marginTop:"20px",gap:"15px"},children:[Q&&e.jsx(et,{variant:"contained",color:"error",onClick:F,disabled:!j||j.length===0,className:i?"app-danger-button":void 0,style:i?void 0:{borderRadius:"8px",fontWeight:"bold",padding:"8px 16px",backgroundColor:"#dc3545",fontSize:l?"12px":"14px"},startIcon:e.jsx(C,{icon:I}),children:"Supprimer selection"}),K||e.jsxs("div",{className:i?"app-table-pagination":void 0,style:i?void 0:{display:"flex",alignItems:"center",gap:"10px"},children:[e.jsx("span",{children:"Lignes par page:"}),e.jsx("select",{value:x,onChange:t=>D({target:{value:t.target.value}}),style:i?void 0:{marginRight:"15px",padding:"5px"},children:[5,10,15,20,25].map(t=>e.jsx("option",{value:t,children:t},t))}),e.jsx("span",{children:`${w*x+1}-${Math.min((w+1)*x,b.length)} sur ${b.length}`})]})]})]})};export{nt as E};
