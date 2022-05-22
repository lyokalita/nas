import axios from 'axios';
import { forEach } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Breadcrumb, Button } from 'react-bootstrap';
import { useCookies } from 'react-cookie';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { download_api } from '../handlers/api';
import { notifyAlert } from '../redux/alert/alertSlice';
import alertType from '../redux/alert/alertType';
import CreateFolderModel from './CreateFolderModel';
import FileDeleteModel from './FileDeleteModel';
import FileUploadModel from './FileUploadModel';

export default function FileToolBar(props) {
    const curDir = useSelector(state => state.fileList.curDir)
    const selectedFiles = useSelector(state => state.fileList.selectedFiles)
    const [search, setSearch] = useSearchParams()
    const [cookie] = useCookies();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [showUpload, setShowUpload] = useState(false)
    const [showDelete, setShowDelete] = useState(false);
    const [disableDownload, setDisableDownload] = useState(false)


    let navList = []
    let temp = ""
    navList.push(
        {
            index: 0,
            name: "root",
            dir: ""
        }
    )
    for (let i = 0; i < curDir.length; i++) {
        temp = temp + "/" + curDir[i]
        let item = {
            index: i + 1,
            name: curDir[i],
            dir: temp
        }
        navList.push(item)
    }

    const onBack = () => {
        let currentDirectoryArr = [...curDir]
        currentDirectoryArr.pop()
        const newDir = currentDirectoryArr.join("/")
        setSearch({ prefix: newDir })
    }

    const getQueryParams = (filename) => {
        return "?key=" + curDir.join("/") + "/" + filename
    }

    const onDownload = (e) => {
        if (selectedFiles.length > 1) {
            return
        }
        selectedFiles.forEach((filename) => {
            axios.post(download_api + getQueryParams(filename),
                null,
                {
                    headers: {
                        "Authorization": `Bearer ${cookie.token}`,
                    }
                })
                .then(res => {
                    const downloadUrl = `${download_api}?signed=${res.data.signed}&nc=${res.data.nonce}`

                    window.open(downloadUrl)
                    // const downloadLink = document.createElement('a', {is: filename})
                    // downloadLink.href = `${download_api}?signed=${signed}&nc=${nonce}`
                    // document.body.appendChild(downloadLink)
                    // downloadLink.click()
                    // downloadLink.parentNode.removeChild(downloadLink)
                }).catch(err => {
                    console.log(err);
                    try {
                        let errMsg = err.message
                        if (err.response.data !== undefined && err.response.data !== "") {
                            errMsg = err.response.data
                        }
                        dispatch(notifyAlert({
                            type: alertType.ERROR,
                            message: errMsg
                        }))
                        if (err.response.status === 401) {
                            navigate('/')
                        }
                    } catch (err) { console.log(err) }
                })
        })
    }

    const onDelete = () => {
        if (selectedFiles.length > 0) {
            setShowDelete(true)
        }
    }

    useEffect(() => {
        if (selectedFiles.length > 1) {
            setDisableDownload(true)
        } else {
            setDisableDownload(false)
        }
    }, [selectedFiles])

    return (
        <div>
            <Breadcrumb>
                    <Breadcrumb.Item></Breadcrumb.Item>
                    {navList.map(item => (
                        <Breadcrumb.Item key={item.index} onClick={() => setSearch({ prefix: item.dir })} >
                            {item.name}
                        </Breadcrumb.Item>
                    ))}
            </Breadcrumb>
            <div className='spacer'>
                <Button variant="secondary" onClick={onBack}>Back</Button>
                <Button variant="info" onClick={props.handleRefresh}>Refresh</Button>
                <Button variant="success" disabled={disableDownload} onClick={onDownload} >Download</Button>
                <Button variant="light" onClick={() => setShowCreateFolder(true)}>Create Folder</Button>
                <Button variant="warning" onClick={() => setShowUpload(true)}>Upload</Button>
                <Button variant="danger" onClick={onDelete}>Delete</Button>
            </div>

            <CreateFolderModel show={showCreateFolder} setShow={setShowCreateFolder} handleRefresh={props.handleRefresh} />
            <FileUploadModel show={showUpload} setShow={setShowUpload} upload={props.upload} handleRefresh={props.handleRefresh} />
            <FileDeleteModel show={showDelete} setShow={setShowDelete} />
        </div>

    );
}
