"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@heroui/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    getLocalVersion,
    setLocalVersion,
    clearOfflineData,
    processWordFile,
} from "@/src/lib/offline-db";
import { Download, CheckCircle, AlertTriangle, Trash2, RefreshCw } from "lucide-react";

type Status =
    | "idle"
    | "checking"
    | "up-to-date"
    | "update-available"
    | "not-downloaded"
    | "downloading"
    | "deleting"
    | "error";

type Metadata = {
    version: number;
    files: string[];
};

export default function OfflineDictionaryClient() {
    const t = useTranslations("OfflineDictionary");
    const [status, setStatus] = useState<Status>("idle");
    const [localVersion, setLocalVersionState] = useState<number | null>(null);
    const [remoteVersion, setRemoteVersion] = useState<number | null>(null);
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const checkStatus = useCallback(async () => {
        setStatus("checking");
        setError(null);
        try {
            // Fetch remote metadata
            const response = await fetch("/offline-data/metadata.json");
            if (!response.ok) throw new Error(t("error.metadata_fetch_failed"));
            const remoteMeta: Metadata = await response.json();
            setRemoteVersion(remoteMeta.version);
            setMetadata(remoteMeta);

            // Get local version
            const localV = await getLocalVersion();
            setLocalVersionState(localV);

            if (!localV) {
                setStatus("not-downloaded");
            } else if (localV === remoteMeta.version) {
                setStatus("up-to-date");
            } else {
                setStatus("update-available");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : String(err));
            setStatus("error");
        }
    }, [t]);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    const handleDownloadOrUpdate = async () => {
        if (!metadata) {
            setError(t("error.no_metadata"));
            setStatus("error");
            return;
        }

        setStatus("downloading");
        setProgress(0);
        setError(null);

        try {
            // It's safer to clear old data before downloading new data
            await clearOfflineData();

            const filesToDownload = metadata.files;
            for (let i = 0; i < filesToDownload.length; i++) {
                const file = filesToDownload[i];
                await processWordFile(`/offline-data/${file}`);
                setProgress(((i + 1) / filesToDownload.length) * 100);
            }

            await setLocalVersion(metadata.version);
            await checkStatus(); // Re-check status to confirm it's up-to-date
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : String(err));
            setStatus("error");
        }
    };

    const handleDelete = async () => {
        setStatus("deleting");
        setError(null);
        try {
            await clearOfflineData();
            await checkStatus(); // Re-check status
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : String(err));
            setStatus("error");
        }
    };

    const renderStatus = () => {
        switch (status) {
            case "checking":
                return <p>{t("status.checking")}...</p>;
            case "up-to-date":
                return (
                    <Alert variant="default" className="dark:bg-green-500 dark:border-green-200 dark:text-green-50 bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-50" />
                        <AlertTitle>{t("status.up_to_date_title")}</AlertTitle>
                        <AlertDescription>{t("status.up_to_date_desc")}</AlertDescription>
                    </Alert>
                );
            case "update-available":
                return (
                    <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle>{t("status.update_available_title")}</AlertTitle>
                        <AlertDescription>{t("status.update_available_desc", { local: new Date(localVersion!).toLocaleString(), remote: new Date(remoteVersion!).toLocaleString() })}</AlertDescription>
                    </Alert>
                );
            case "not-downloaded":
                return (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t("status.not_downloaded_title")}</AlertTitle>
                        <AlertDescription>{t("status.not_downloaded_desc")}</AlertDescription>
                    </Alert>
                );
            case "downloading":
                return (
                    <div>
                        <p>{t("status.downloading")}...</p>
                        <Progress value={progress} className="w-full mt-2" />
                        <p className="text-sm text-center mt-1">{Math.round(progress)}%</p>
                    </div>
                );
            case "deleting":
                return <p>{t("status.deleting")}...</p>;
            case "error":
                return (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t("status.error_title")}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                );
            default:
                return null;
        }
    };

    const isLoading = status === 'checking' || status === 'downloading' || status === 'deleting';

    return (
        <>
            <CardContent className="space-y-4">
                {renderStatus()}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={isLoading || !localVersion}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> {t("buttons.delete")}
                </Button>
                <div>
                    <Button onClick={checkStatus} variant="ghost" disabled={isLoading} className="mr-2">
                        <RefreshCw className="mr-2 h-4 w-4" /> {t("buttons.check_status")}
                    </Button>
                    {status === "not-downloaded" && (
                        <Button onClick={handleDownloadOrUpdate} disabled={isLoading}>
                            <Download className="mr-2 h-4 w-4" /> {t("buttons.download")}
                        </Button>
                    )}
                    {status === "update-available" && (
                        <Button onClick={handleDownloadOrUpdate} disabled={isLoading}>
                            <Download className="mr-2 h-4 w-4" /> {t("buttons.update")}
                        </Button>
                    )}
                </div>
            </CardFooter>
        </>
    );
}
