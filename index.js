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
    
                    if ( child.isMesh ) {

                        if( params.fileName == "Silk_TunnelOnly_V4_dream.glb" ) {
                            child.material = getSilkMaterialClone();
                            
                            let distanceScale = child.position.distanceTo( p ) * 10000;
                            child.dist = distanceScale;
                            child.material.side = THREE.DoubleSide;
                            silkNodesArray.push( child );
                        }

                        
                        if( params.fileName == 'Heart_Fountain_V2_galad.glb' ){

                            if( child.name == 'Silk-low' ){
                                child.material = getSilkMaterialClone();
                                let distanceScale = child.position.distanceTo( p ) * 10000;
                                child.dist = distanceScale;
                                child.material.side = THREE.DoubleSide;
                                silkNodesArray.push( child );
                            }
                            
                        }

                        child.material.side = THREE.DoubleSide;
                        numVerts += child.geometry.index.count / 3;  
                    }
                });
    
    
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
            shaderMesh.material.uniforms.tileCaustic_brightness.value = 1.5 - ( ( ( 1 + Math.sin( shaderMesh.dist + silkBrightnessVal ) ) * 0.5 ) );
            shaderMesh.material.uniforms.noiseRipples_brightness.value = 0.1 - ( ( ( 1 + Math.sin( shaderMesh.dist + silkBrightnessVal ) ) * 0.5 ) * 0.075 );
        }
    });

    useCleanup(() => {
        for (const physicsId of physicsIds) {
            physics.removeGeometry(physicsId);
        }
    });

    return app;
}