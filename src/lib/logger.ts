type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
    [key: string]: any;
}

class Logger {
    private format(level: LogLevel, message: string, payload?: LogPayload) {
        const timestamp = new Date().toISOString();
        return JSON.stringify({
            timestamp,
            level: level.toUpperCase(),
            message,
            ...(payload || {}),
        });
    }

    info(message: string, payload?: LogPayload) {
        console.log(this.format("info", message, payload));
    }

    warn(message: string, payload?: LogPayload) {
        console.warn(this.format("warn", message, payload));
    }

    error(message: string, payload?: LogPayload) {
        console.error(this.format("error", message, payload));
    }

    debug(message: string, payload?: LogPayload) {
        if (process.env.NODE_ENV === "development") {
            console.debug(this.format("debug", message, payload));
        }
    }
}

export const logger = new Logger();
