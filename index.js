import * as THREE from 'three';
import SilkShader from './shaders/SilkShader.js';

import metaversefile from 'metaversefile';

const {useApp, useFrame, useLoaders, useCleanup, usePhysics} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 


export default () => {  

    const app = useApp();
    const physics = usePhysics();
    const physicsIds = [];

    let silkFountain1Pos = new THREE.Vector3( 0, 0, 0 );
    let silkBrightnessVal = 0;
    let distCtr = 0;
    const silkNodesArray = [];
    

    const silkMaterialTexture = new THREE.TextureLoader().load( baseUrl + "textures/silk/silk-contrast-noise.png" );
    silkMaterialTexture.wrapS = silkMaterialTexture.wrapT = THREE.RepeatWrapping;

    const silkShaderMaterial = new THREE.ShaderMaterial({
        uniforms: SilkShader.uniforms,
        vertexShader: SilkShader.vertexShader,
        fragmentShader: SilkShader.fragmentShader,
        side: THREE.DoubleSide,
        fog: false
    })

    silkShaderMaterial.uniforms.noiseImage.value = silkMaterialTexture;
    
    const getSilkMaterialClone = () => {
        let silkMaterialClone = silkShaderMaterial.clone();
        silkMaterialClone.uniforms.noiseImage.value = silkMaterialTexture;

        let seed = Math.random() * 0;
        silkMaterialClone.seed = seed;
    
        return silkMaterialClone;
    }


    const loadModel = ( params ) => {


        return new Promise( ( resolve, reject ) => {
                
            //const loader = new GLTFLoader();
            const { gltfLoader } = useLoaders();
            const { dracoLoader } = useLoaders();
            //dracoLoader.setDecoderPath( baseUrl + "draco-decoder/" );
            gltfLoader.setDRACOLoader( dracoLoader );
    
            gltfLoader.load( params.filePath + params.fileName, function( gltf ) {
    
                let numVerts = 0;
                let p = new THREE.Vector3( 15, 0, 0);
    
                gltf.scene.traverse( function ( child ) {

                    

                    /* if( params.fileName == "TunnelOnly_V4_dream.glb" ) {
                        const physicsId = physics.addGeometry( child );
                        physicsIds.push( physicsId );
                    } */
                       
    
                    if ( child.isMesh ) {

                        if( params.fileName == "Silk_TunnelOnly_V4_dream.glb" ) {
                            child.material = getSilkMaterialClone();

                            console.log( 'SILK NAME ' + child.name )
                            
                            let distanceScale = child.position.distanceTo( p ) * 10000;
                            child.dist = distanceScale;
                            child.material.side = THREE.FrontSide;
                            silkNodesArray.push( child );
                        }

                        
                        if( params.fileName == 'Heart_Fountain_V2_galad.glb' ){

                            if( child.name == 'Silk' ){
                                child.material = getSilkMaterialClone();
                                let distanceScale = child.position.distanceTo( p ) * 10000;
                                child.dist = distanceScale;
                                child.material.side = THREE.FrontSide;
                                silkNodesArray.push( child );
                            }
                            
                        }
                    
                        //child.castShadow = true;
                        //child.receiveShadow = true;
                        child.material.side = THREE.FrontSide;
                        numVerts += child.geometry.index.count / 3;  
                    }
                }.bind( this ));
    
                console.log( 'addModel() num verts: ' + numVerts );
    
                
                //gltf.scene.rotation.set( params.modelRotationAngles.x * Math.PI / 180, params.modelRotationAngles.y * Math.PI / 180, params.modelRotationAngles.z * Math.PI / 180 );
                //gltf.scene.scale.set( 0.2, 0.2, 0.2 );
    
                //gltf.scene.position.set( params.modelPos.x, params.modelPos.y, params.modelPos.z );
    
                resolve( gltf.scene ); 
            });
        })
    }

    loadModel( { 
        filePath: baseUrl,
        fileName: 'TunnelOnly_V4_dream.glb',
        pos: { x: 0, y: 0, z: 0 },
    } ).then ( 
        result => {
            app.add( result );
            result.updateMatrixWorld();
            const physicsId = physics.addGeometry( result.children[ 0 ] );
            physicsIds.push( physicsId );
        }
    )

    loadModel( { 
        filePath: baseUrl,
        fileName: 'Silk_TunnelOnly_V4_dream.glb',
        pos: { x: 0, y: 0, z: 0 },
    } ).then ( 
        result => {
            app.add( result );
            result.updateMatrixWorld();
        }
    )

    loadModel( { 
        filePath: baseUrl,
        fileName: 'Heart_Fountain_V2_galad.glb',
        pos: { x: 0, y: 0, z: 0 },
    } ).then ( 
        result => {
            app.add( result );
            result.updateMatrixWorld();
        }
    )

    useFrame(( { timestamp } ) => {

        silkBrightnessVal += 0.2;

        for( let i = 0; i < silkNodesArray.length; i++ ){
            let shaderMesh = silkNodesArray[ i ];
            shaderMesh.material.seed += 0.005;
            shaderMesh.material.uniforms.time.value = shaderMesh.material.seed;
            // needs refining - purely for debugging at present
            shaderMesh.material.uniforms.contrast.value = 5.5 + ( Math.sin( shaderMesh.dist + silkBrightnessVal ) * 1 ) * 1.5 * 10;
        }
    });

    useCleanup(() => {
        for (const physicsId of physicsIds) {
            physics.removeGeometry(physicsId);
        }
    });

    return app;
}