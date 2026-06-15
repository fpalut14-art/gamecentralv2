'use client';
import React,{useEffect,useState}from'react';import{collection,getDocs}from'firebase/firestore';import{db}from'@/lib/firebase';
export default function Logs(){const[logs,setLogs]=useState<any[]>([]);useEffect(()=>{getDocs(collection(db,'logs')).then(s=>setLogs(s.docs.map(d=>({id:d.id,...d.data()}))))},[]);return <div><h1 style={{color:'#ffd400'}}>Sistem Logları</h1>{logs.length===0&&<p>Log yok.</p>}{logs.map(l=><pre key={l.id} style={{padding:16,background:'#101827',borderRadius:12,whiteSpace:'pre-wrap'}}>{JSON.stringify(l,null,2)}</pre>)}</div>}
