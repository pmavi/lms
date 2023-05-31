(this["webpackJsonplegacyfarmer-web-client"]=this["webpackJsonplegacyfarmer-web-client"]||[]).push([[4],{1212:function(e,t,a){"use strict";var n=a(6),i=a(21),r=a(0),o=a(30),c=a(297),s=a(43),l=a(922),u=r.forwardRef((function(e,t){var a=e.children,s=e.classes,u=e.className,d=e.component,b=void 0===d?"div":d,p=e.disablePointerEvents,m=void 0!==p&&p,j=e.disableTypography,f=void 0!==j&&j,O=e.position,v=e.variant,h=Object(i.a)(e,["children","classes","className","component","disablePointerEvents","disableTypography","position","variant"]),g=Object(l.b)()||{},y=v;return v&&g.variant,g&&!y&&(y=g.variant),r.createElement(l.a.Provider,{value:null},r.createElement(b,Object(n.a)({className:Object(o.default)(s.root,u,m&&s.disablePointerEvents,g.hiddenLabel&&s.hiddenLabel,"filled"===y&&s.filled,{start:s.positionStart,end:s.positionEnd}[O],"dense"===g.margin&&s.marginDense),ref:t},h),"string"!==typeof a||f?a:r.createElement(c.a,{color:"textSecondary"},a)))}));t.a=Object(s.a)({root:{display:"flex",height:"0.01em",maxHeight:"2em",alignItems:"center",whiteSpace:"nowrap"},filled:{"&$positionStart:not($hiddenLabel)":{marginTop:16}},positionStart:{marginRight:8},positionEnd:{marginLeft:8},disablePointerEvents:{pointerEvents:"none"},hiddenLabel:{},marginDense:{}},{name:"MuiInputAdornment"})(u)},1548:function(e,t,a){"use strict";var n=a(69),i=a(304);Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=i(a(0)),o=(0,n(a(456)).default)(r.createElement("path",{d:"M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"}),"VisibilityOff");t.default=o},1549:function(e,t,a){"use strict";var n=a(69),i=a(304);Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=i(a(0)),o=(0,n(a(456)).default)(r.createElement("path",{d:"M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"}),"Visibility");t.default=o},1561:function(e,t,a){"use strict";a.r(t),a.d(t,"default",(function(){return J}));var n=a(48),i=a.n(n),r=a(13),o=a(107),c=a(12),s=a(55),l=a(85),u=a.n(l),d=a(301),b=a.n(d),p=a(1599),m=a(300),j=a(0),f=a(99),O=a(49),v=a(36),h=a(1562),g=a(1642),y=a(28),x=a(299),w=a(857),C=a(899),S=a(858),P=a(869),k=a(856),V=a(194),I=a(855),E=a(200),N=a(821),K=a(1212),z=a(1549),L=a.n(z),D=a(1548),M=a.n(D),R=a(853),T=a(134),_=a(1);function B(e){var t=e.password,a=e.confirm,n=e.margin,i=e.onChange,o=e.isNew,s=e.disabled,l=Object(j.useState)(!1),u=Object(c.a)(l,2),d=u[0],b=u[1],p=Object(j.useState)({}),m=Object(c.a)(p,2),f=m[0],O=m[1];Object(j.useEffect)((function(){var e=document.getElementById("confirm_password");e&&e.setCustomValidity(f.confirm!==f.password?"Confirm does not match the password.":"")}),[f.confirm,f.password,t,a]);var v=function(e){O(Object(r.a)(Object(r.a)({},f),Object(T.c)(e))),i&&i(e)};return Object(_.jsxs)(j.Fragment,{children:[Object(_.jsx)(R.a,{name:"password",inputProps:{pattern:"^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&-]{8,}$",title:"Password must contain at least 8 characters with one or more uppercase, lowercase, number and symbol."},labelKey:o?"user.password.label":"user.changePassword.label",fullWidth:!0,required:o,disabled:s,type:d?"text":"password",autoComplete:"current-password",onChange:v,value:t,margin:n,InputProps:{"aria-label":"Password",endAdornment:Object(_.jsx)(K.a,{position:"end",children:Object(_.jsx)(N.a,{"aria-label":"Toggle password visibility",onMouseDown:function(){b(!d)},disabled:s,children:d?Object(_.jsx)(M.a,{}):Object(_.jsx)(L.a,{})})})}}),!d&&Object(_.jsx)(R.a,{name:"confirm",labelKey:"user.confirm.label",type:"password",required:o,onChange:v,value:a,autoComplete:"current-password",fullWidth:!0,disabled:s,InputProps:{id:"confirm_password"}})]})}var W=a(133),U=a(24),F=a(852),q=a(871),A=a(849),H=a(1174),$=u()((function(e){return{formStyle:{maxHeight:"100%",width:"100%",display:"flex",flexDirection:"column"},infoRootStyle:{maxHeight:"calc(100% - ".concat(e.spacing(5),"px)"),"& > *":{marginRight:e.spacing(1)},overflow:"auto",marginBottom:e.spacing(1)},infoInnerStyle:{padding:e.spacing(0,2)},buttonPanelStyle:{marginLeft:-8,borderTop:"solid 1px ".concat(e.palette.divider),margin:e.spacing(0,0,0,0),padding:e.spacing(1,2,0),"& > *":{marginRight:e.spacing(1)}},frameStyle:{padding:e.spacing(3,0)},"::placeholder":{color:"#707070 !important"},buttonStyle:{margin:e.spacing(1),"&:hover":{color:e.palette.error.main}},deleteColorStyle:{backgroundColor:Object(s.e)(e.palette.error.light,.7),"&:hover":{backgroundColor:Object(s.e)(e.palette.error.light,.8)}},deleteButtonStyle:{"&:hover":{color:e.palette.error.main}}}}),{name:"UserEditStyles"});function J(e){var t,a=this,n=e.isAdmin,s=void 0!==n&&n,l=$(),u=b()(),d=Object(O.j)(),N=d.clientId,K=d.userId,z=Object(f.a)(),L=Object(O.h)(),D={name:"",username:"",clientId:N,isDeleted:!1},M=Object(O.i)(),J=(null===M||void 0===M||null===(t=M.state)||void 0===t?void 0:t.id)||K,Z=!J,G=Object(F.a)(x.ub,{variables:{clientId:N,id:J},skip:!(s||Object(h.a)(N))||!J},"user.type"),Q=Object(c.a)(G,1)[0],X=Object(U.e)(x.vb),Y=Object(c.a)(X,1)[0],ee=Object(U.e)(x.wb),te=Object(c.a)(ee,1)[0],ae=Object(j.useState)(!1),ne=Object(c.a)(ae,2),ie=ne[0],re=ne[1],oe=Object(k.a)(Z?D:void 0,["id","clientId"]),ce=Object(c.a)(oe,3),se=ce[0],le=ce[1],ue=ce[2],de=ue.isChanged,be=void 0!==de&&de,pe=ue.setIsChanged,me=ue.defaultValues,je=ue.setDefaultValues,fe=ue.resetValues,Oe=ue.getValue,ve=Object(v.d)(E.a);Object(j.useEffect)((function(){Z&&fe()}),[Z,fe]),Object(j.useEffect)((function(){var e;(null===Q||void 0===Q||null===(e=Q.users)||void 0===e?void 0:e.length)>0&&(fe(),je(Q.users[0]))}),[Q,je,fe]);var he=Object(j.useCallback)((function(){fe(),Object(m.defer)((function(){s?L.replace(y.i):(M.state={edit:void 0,id:void 0,nodeIdOpen:H.b},L.replace(M))}))}),[s,fe,M,L]);Object(q.a)(he);var ge=Object(j.useCallback)(Object(o.a)(i.a.mark((function e(){return i.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!be){e.next=15;break}return e.prev=1,re(!0),e.next=5,Y({variables:Object(r.a)({id:Object(g.a)()},se),optimisticResponse:{__typename:"Mutation",user:Object(r.a)(Object(r.a)(Object(r.a)({__typename:"User"},me),se),{},{clientId:Oe("clientId")||"",isDeleted:!1})},update:Object(A.e)(Object(x.Rb)(N||null),se.id,"user")});case 5:re(!1),pe(!1),he(),e.next=13;break;case 10:e.prev=10,e.t0=e.catch(1),re(!1);case 13:e.next=16;break;case 15:he();case 16:case"end":return e.stop()}}),e,null,[[1,10]])}))),[Oe,N,Y,he,be,me,se,pe]),ye=function(){var e=Object(o.a)(i.a.mark((function e(t){return i.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t&&(t.stopPropagation(),t.preventDefault()),re(!0),e.next=4,te({variables:{id:J},optimisticResponse:{user_Delete:1},update:Object(A.d)(Object(x.Rb)(N||null),J)});case 4:re(!1),he();case 6:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),xe=Object(j.useCallback)((function(e,t,n,i,r){if(le(e,t,n,i,r),"password"===r){var o=document.getElementById("confirm_password");o&&o.setCustomValidity(a.state.confirm!==a.state.password?Object(T.f)(z,"user.confirmMismatch.message","Confirm does not match the password."):"")}}),[le,z]);return Object(_.jsxs)(V.a,{container:!0,fullWidth:!0,fullHeight:!0,className:l.frameStyle,direction:"column",overflow:"visible",wrap:"nowrap",children:[!s&&Object(_.jsx)(V.a,{item:!0,resizable:!1,className:l.infoInnerStyle,children:Object(_.jsx)(W.a,{variant:"h5",id:"user.title.label",color:"textSecondary",gutterBottom:!0})}),Object(_.jsx)(V.a,{item:!0,container:!0,resizable:!0,children:Object(_.jsxs)(S.a,{onSubmit:ge,className:l.formStyle,children:[Object(_.jsx)(P.a,{when:be}),Object(_.jsx)(V.a,{name:"User Edit Root",item:!0,fullWidth:!0,className:l.infoRootStyle,children:Object(_.jsxs)(V.a,{name:"User Edit Inner",container:!0,item:!0,fullWidth:!0,className:l.infoInnerStyle,children:[Object(_.jsx)(R.a,{name:"contactName",autoFocus:!0,labelTemplate:"user.{name}.label",onChange:le,defaultValue:me.contactName,value:se.contactName,required:!0},"contactName"+me.id),Object(_.jsx)(R.a,{name:"email",labelTemplate:"user.{name}.label",onChange:le,defaultValue:me.email,value:se.email,required:!0},"email"+me.id),Object(_.jsx)(R.a,{name:"username",labelTemplate:"user.{name}.label",onChange:le,defaultValue:me.username,value:se.username,disabled:!Z,helperText:Z?void 0:"Username cannot be changed",required:!0},"username"+me.id),Object(_.jsx)(B,{name:"password",fullWidth:!0,isNew:Z,disabled:ie,onChange:xe,password:se.password,confirm:se.confirm},"password"+me.id)]})}),Object(_.jsxs)(V.a,{container:!0,item:!0,direction:"row",fullWidth:!0,className:l.buttonPanelStyle,justify:"space-between",overflow:"visible",resizable:!1,alignItems:"center",children:[Object(_.jsxs)(V.a,{item:!0,children:[Object(_.jsx)(I.a,{isProgress:ie,variant:"text",color:"primary",type:"submit",size:"large",labelKey:"save.label",disabled:ie}),Object(_.jsx)(w.a,{variant:"text",size:"large",labelKey:"cancel.button",disabled:ie,onClick:function(){return he()}})]}),s&&(null===me||void 0===me?void 0:me.username)!==(null===ve||void 0===ve?void 0:ve.username)&&Object(_.jsx)(V.a,{item:!0,children:Object(_.jsx)(C.a,{className:l.buttonStyle,color:u.palette.error.dark,onConfirm:ye,values:{type:s?"admin user":"user",name:Oe("contactName")},size:"large",submitStyle:l.deleteColorStyle,startIcon:Object(_.jsx)(p.a,{}),buttonTypographyProps:{variant:"inherit"},disabled:ie||Z})})]})]})})]})}},853:function(e,t,a){"use strict";a.d(t,"a",(function(){return O}));var n=a(13),i=a(34),r=a(252),o=a.n(r),c=a(1640),s=a(63),l=a.n(s),u=a(0),d=a(877),b=a(305),p=a(878),m=a(307),j=a(1),f=o()({palette:{text:{secondary:"#707070",primary:"#527928"}}});function O(e){var t=e.className,a=e.name,r=e.labelKey,o=e.placeholderKey,s=e.helpKey,O=e.helperText,v=e.defaultValue,h=e.value,g=e.onChange,y=e.margin,x=void 0===y?"normal":y,w=e.InputLabelProps,C=e.InputProps,S=e.label,P=e.fullWidth,k=void 0===P||P,V=e.isFormattedNumber,I=e.variant,E=void 0===I?"outlined":I,N=e.size,K=void 0===N?"small":N,z=e.labelTemplate,L=(e.editData,e.classes),D=e.internalKey,M=e.placeholder,R=Object(i.a)(e,["className","name","labelKey","placeholderKey","helpKey","helperText","defaultValue","value","onChange","margin","InputLabelProps","InputProps","label","fullWidth","isFormattedNumber","variant","size","labelTemplate","editData","classes","internalKey","placeholder"]),T=Object(n.a)({},L),_=(null===z||void 0===z?void 0:z.format({name:a}))||r,B=Object(b.a)(_,S),W=Object(b.a)(o)||M,U=Object(b.a)(s,O)||O,F=Object(n.a)({},C);return V&&((l()(C,"inputComponent")||l()(C,"inputProps.component"))&&console.log("isFormattedNumber cannot have a different input component.",C),F.inputComponent=p.a,F.inputProps=Object(n.a)(Object(n.a)(Object(n.a)({},l()(C,"inputProps",{})),R.inputProps||{}),{},{component:d.a})),Object(j.jsx)(m.a,{theme:f,children:Object(u.createElement)(c.a,Object(n.a)(Object(n.a)({},R),{},{key:"internal"+D,name:a,className:"".concat(T.textFieldStyle," ").concat(t),label:B,placeholder:W,helperText:U,defaultValue:v,value:h,onChange:g,InputProps:F,InputLabelProps:Object(n.a)(Object(n.a)({},w),{},{shrink:!0}),variant:E,size:K,margin:x,fullWidth:k}))})}},855:function(e,t,a){"use strict";a.d(t,"a",(function(){return b}));var n=a(13),i=a(34),r=a(820),o=a(251),c=a(85),s=a.n(c),l=(a(0),a(133)),u=a(1),d=s()((function(e){return{spinnerMargin:{marginLeft:e.spacing(.5),color:"white"},darkSpinnerMargin:{marginLeft:e.spacing(.5),color:e.palette.primary.main}}}),{name:"ProgressButtonStyles"});function b(e){var t,a=e.isProgress,c=void 0!==a&&a,s=e.labelKey,b=e.isSpinnerLight,p=void 0!==b&&b,m=e.children,j=e.typographyProps,f=Object(i.a)(e,["isProgress","labelKey","isSpinnerLight","children","typographyProps"]),O=d();return Object(u.jsxs)(r.a,Object(n.a)(Object(n.a)({},f),{},{children:[s&&Object(u.jsx)(l.a,Object(n.a)({variant:"inherit",id:s},j)),m,c&&Object(u.jsx)(o.a,{className:(null===f||void 0===f||null===(t=f.classes)||void 0===t?void 0:t.spinnerMargin)||(p?O.spinnerMargin:O.darkSpinnerMargin),size:15,thickness:2.5})]}))}},856:function(e,t,a){"use strict";a.d(t,"a",(function(){return f}));var n=a(35),i=a(13),r=a(64),o=a(12),c=a(63),s=a.n(c),l=a(54),u=a.n(l),d=a(893),b=a.n(d),p=a(0),m=a(1642),j=a(134);function f(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],a=arguments.length>2&&void 0!==arguments[2]&&arguments[2],c=arguments.length>3?arguments[3]:void 0,l=Object(p.useState)(!1),d=Object(o.a)(l,2),f=d[0],O=d[1],v=Object(p.useState)(e||(a?[]:{})),h=Object(o.a)(v,2),g=h[0],y=h[1],x=Object(p.useState)(a?[]:u()(t)?{}:t),w=Object(o.a)(x,2),C=w[0],S=w[1];Object(p.useEffect)((function(){var e;g&&!a&&(e=u()(t)?b()(g,["id"].concat(Object(r.a)(t))):Object(i.a)({},g),S(Object(i.a)(Object(i.a)({},C),e)))}),[g,a]);var P=function(e,n,o,s,l){var d=s;if(a)k(e);else{var p,m;if(s?p=Object(i.a)(Object(i.a)({},C),s):(d=Object(j.c)(e,n,o,!0,s,l),p=Object(i.a)(Object(i.a)({},C),d)),S(p),c)m=u()(t)?b()(g,["id"].concat(Object(r.a)(t))):Object(i.a)({},g),null===c||void 0===c||c(Object(i.a)(Object(i.a)({},m),d),p);"reset"!==o&&O(!0)}return d},k=function(e){var a=s()(e,"target.dataset.index"),o=Object(j.c)(e,void 0,void 0,!1),c=o.componentName,l=o.newValue,d=C[a];if(d)C[a]=Object(i.a)(Object(i.a)({},d),{},Object(n.a)({},c,l));else{var p={};if(u()(g)){var f=s()(g,"[".concat(a,"]"));f&&(p=u()(t)?b()(f,t):{uuid:f,id:f.id})}else g&&(u()(t)?(p=b()(g,t)).uuid=Object(m.a)():p={uuid:Object(m.a)(),id:g.id});C[a]=Object(i.a)(Object(n.a)({},c,l),p)}S(Object(r.a)(C)),O(!0)},V=Object(p.useCallback)((function(n){var o,c=n||e||(a?[]:{});o=u()(t)?b()(c,["id"].concat(Object(r.a)(t))):Object(i.a)({},c),S(Object(i.a)({},o)),y(c),O(!1)}),[a]),I=function(e,t){S((function(a){return Object(i.a)(Object(i.a)({},a),{},Object(n.a)({},t,e))})),O(!0)},E=Object(p.useCallback)((function(e,t){var a=s()(C,e);return void 0!==a?a:s()(g,e)||t}),[C,g]),N=Object(p.useCallback)((function(e,a){var o,s=arguments.length>2&&void 0!==arguments[2]&&arguments[2],l=Object(i.a)(Object(i.a)({},C),{},Object(n.a)({},e,a));(S((function(t){return Object(i.a)(Object(i.a)({},t),{},Object(n.a)({},e,a))})),s&&O(!0),c)&&(o=u()(t)?b()(g,["id"].concat(Object(r.a)(t))):Object(i.a)({},g),null===c||void 0===c||c(Object(i.a)(Object(i.a)({},o),l),l))}),[C,g]),K=Object(p.useCallback)((function(e){return Object(j.j)(E(e))}),[E]);return[C,P,{handleSelectChange:I,isChanged:f,setIsChanged:O,setEditValues:S,defaultValues:g,setDefaultValues:y,resetValues:V,getValue:E,setValue:N,hasValue:K}]}},858:function(e,t,a){"use strict";var n=a(13),i=a(34),r=a(0),o=a(1),c=Object(r.forwardRef)((function(e,t){var a=e.onSubmit,c=e.onValid,s=e.validate,l=e.customValidity,u=e.reportInvalid,d=e.children,b=Object(i.a)(e,["onSubmit","onValid","validate","customValidity","reportInvalid","children"]),p=Object(r.useRef)(),m=t||p;Object(r.useEffect)((function(){s&&function(){var e,t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0],a=m.current;return!a||((e=a.checkValidity())&&l&&(e=l()),!e&&t?a.reportValidity():e)}(u)&&c&&c()}),[s,u,l,c,m]);return Object(o.jsx)("form",Object(n.a)(Object(n.a)({ref:m,onSubmit:function(e){e&&e.preventDefault(),e&&e.stopPropagation();var t=m.current,n=!0;if(l&&(n=l()),!n&&u)return t.reportValidity();n&&a&&a(e)}},b),{},{className:b.className,children:d}))}));c.defaultProps={validate:!1,reportInvalid:!0},t.a=c},869:function(e,t,a){"use strict";a.d(t,"a",(function(){return u}));var n=a(13),i=a(34),r=a(0),o=a(99),c=a(49),s=a(134),l=a(1);function u(e){var t=e.when,a=e.messageKey,u=void 0===a?"leavePage":a,d=e.message,b=Object(i.a)(e,["when","messageKey","message"]),p=Object(o.a)(),m=Object(c.i)(),j=Object(r.useCallback)((function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(e&&m&&e.pathname!==window.location.pathname)return u?Object(s.f)(p,"leavePage","Discard changes?"):d}),[p,d,u,m]);return Object(l.jsx)(c.a,Object(n.a)({when:t,message:j},b))}},871:function(e,t,a){"use strict";var n=a(0),i=a(23),r=a.n(i);function o(e,t){var a=arguments.length>2&&void 0!==arguments[2]&&arguments[2],i=arguments.length>3?arguments[3]:void 0,r=Object(n.useCallback)((function(n){!a&&n.defaultPrevented||("Escape"===n.key&&e?(n.preventDefault(),e(n)):"Enter"===n.key&&t?t(n):null===i||void 0===i||i(n))}),[a,e,i,t]);return Object(n.useEffect)((function(){document.addEventListener("keydown",r,!1)}),[r]),Object(n.useLayoutEffect)((function(){return function(){document.removeEventListener("keydown",r,!1)}}),[r]),[r,t,e]}o.propTypes={onClose:r.a.func,onSubmit:r.a.func},t.a=o},882:function(e,t,a){var n=a(312),i=a(894);e.exports=function e(t,a,r,o,c){var s=-1,l=t.length;for(r||(r=i),c||(c=[]);++s<l;){var u=t[s];a>0&&r(u)?a>1?e(u,a-1,r,o,c):n(c,u):o||(c[c.length]=u)}return c}},893:function(e,t,a){var n=a(926),i=a(927)((function(e,t){return null==e?{}:n(e,t)}));e.exports=i},894:function(e,t,a){var n=a(136),i=a(169),r=a(54),o=n?n.isConcatSpreadable:void 0;e.exports=function(e){return r(e)||i(e)||!!(o&&e&&e[o])}},899:function(e,t,a){"use strict";a.d(t,"a",(function(){return g}));var n=a(13),i=a(12),r=a(34),o=a(821),c=a(839),s=a(196),l=a.n(s),u=a(0),d=a(865),b=a(28),p=a(876),m=a(855),j=a(133),f=a(85),O=a.n(f),v=a(1),h=O()((function(e){return{messageStyle:{backgroundColor:"".concat(e.palette.background.default," !important"),color:"".concat(e.palette.text.secondary," !important"),paddingRight:e.spacing(6)},snackbarMessageStyle:{marginRight:e.spacing(1)},closeButtonStyle:{position:"absolute",right:0,top:0,marginLeft:"auto",zIndex:1001}}}),{name:"ConfirmButtonStyles"});function g(e){var t=e.titleKey,a=void 0===t?"confirmRemove.title":t,s=e.messageKey,f=void 0===s?"confirmRemoveValue.message":s,O=e.buttonLabelKey,g=void 0===O?"delete.button":O,y=e.onConfirm,x=e.onCancel,w=e.confirmProps,C=e.children,S=e.color,P=e.component,k=e.values,V=e.titleValues,I=e.isProgress,E=void 0!==I&&I,N=e.submitStyle,K=e.onUndo,z=void 0!==K&&K,L=e.buttonTypographyProps,D=Object(r.a)(e,["titleKey","messageKey","buttonLabelKey","onConfirm","onCancel","confirmProps","children","color","component","values","titleValues","isProgress","submitStyle","onUndo","buttonTypographyProps"]),M=h(),R=Object(u.useState)(!1),T=Object(i.a)(R,2),_=T[0],B=T[1],W=Object(u.useState)(!1),U=Object(i.a)(W,2),F=U[0],q=U[1],A=V||k,H=function(){q(!1)};return Object(v.jsxs)(u.Fragment,{children:[_&&Object(v.jsx)(p.a,Object(n.a)(Object(n.a)({submitKey:g},w),{},{titleKey:a,messageKey:f,onSubmit:function(e){e&&(e.stopPropagation(),e.preventDefault()),B(!1),z&&q(!0),y&&y()},onClose:function(){B(!1),x&&x()},hideBackdrop:!0,submitColor:S,messageValues:k,titleValues:A,submitColorStyle:N})),F&&Object(v.jsx)(c.a,{open:!0,autoHideDuration:b.hb,onClose:H,ContentProps:{classes:{root:M.messageStyle}},message:Object(v.jsx)(j.a,{id:"confirmRemoveValue.Undo.message",variant:"subtitle1",className:M.snackbarMessageStyle,values:k,color:"inherit",children:Object(v.jsx)(d.a,{labelKey:"undo.label",onClick:function(){null===z||void 0===z||z(),H()}})}),action:[Object(v.jsx)(o.a,{"aria-label":"Close",color:"inherit",size:"small",className:M.closeButtonStyle,onClick:H,children:Object(v.jsx)(l.a,{fontSize:"inherit"})},"close")]}),Object(v.jsxs)(m.a,Object(n.a)(Object(n.a)({isProgress:E,onClick:function(e){var t;e&&(e.stopPropagation(),e.preventDefault()),"submit"!==D.type&&B(!0),null===D||void 0===D||null===(t=D.onClick)||void 0===t||t.call(D,e)},color:S,isSpinnerLight:!0},D),{},{children:[!P&&g&&Object(v.jsx)(j.a,Object(n.a)({variant:"button",id:g},L)),C]}))]})}},926:function(e,t,a){var n=a(466),i=a(465);e.exports=function(e,t){return n(e,t,(function(t,a){return i(e,a)}))}},927:function(e,t,a){var n=a(928),i=a(462),r=a(463);e.exports=function(e){return r(i(e,void 0,n),e+"")}},928:function(e,t,a){var n=a(882);e.exports=function(e){return(null==e?0:e.length)?n(e,1):[]}}}]);
//# sourceMappingURL=4.a8d1b924.chunk.js.map