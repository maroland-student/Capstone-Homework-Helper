// utilities/cameraUtility.tsx

import * as FileSystem from "expo-file-system/legacy";

export class CameraUtility{
    private static uri: string | null = null;

    /**
     * Retrieves the stored uri of the last captured photo, if it exists and is valid.
     * @returns The stored uri of the last captured photo, or null if none is stored.
     */
    public static getCaptureUri(){
        if(!this.isCaptureUriValid())
            return null;
        return this.uri;
    }

    /**
     * Store the uri of a captured photo for later retrieval.
     * @param path The uri file path of the captured photo to store.
     */
    public static setCaptureUri(path: string){
        this.uri = path;
    }

    /**
     * Checks if the camera utility has a valid URI from a stored photo.
     * @returns True if a valid URI exists, false otherwise.
     */
    public static async isCaptureUriValid(){
        if(!this.uri)
            return false;

        //const info = await FileSystem.getInfoAsync(this.uri);
        //return info.exists;
        return true;
    }

    /**
     * Get the bytes of the last captured photo as a base64 string, if available.
     */
    public static getCaptureBytes(){
        if(!this.isCaptureUriValid())
            return null;

        return FileSystem.readAsStringAsync(this.uri!, { encoding: "base64" });
    }
}