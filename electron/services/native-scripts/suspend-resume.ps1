param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Suspend", "Resume")]
    [string]$Action,

    [Parameter(Mandatory=$true)]
    [int]$ProcessId
)

$source = @"
using System;
using System.Runtime.InteropServices;

public class Win32ProcessSuspender {
    [DllImport("ntdll.dll")]
    public static extern int NtSuspendProcess(IntPtr processHandle);

    [DllImport("ntdll.dll")]
    public static extern int NtResumeProcess(IntPtr processHandle);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr OpenProcess(int processAccess, bool bInheritHandle, int processId);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool CloseHandle(IntPtr hObject);

    const int PROCESS_SUSPEND_RESUME = 0x0800;

    public static bool Suspend(int pid) {
        IntPtr h = OpenProcess(PROCESS_SUSPEND_RESUME, false, pid);
        if (h == IntPtr.Zero) return false;
        try {
            return NtSuspendProcess(h) == 0;
        } finally {
            CloseHandle(h);
        }
    }

    public static bool Resume(int pid) {
        IntPtr h = OpenProcess(PROCESS_SUSPEND_RESUME, false, pid);
        if (h == IntPtr.Zero) return false;
        try {
            return NtResumeProcess(h) == 0;
        } finally {
            CloseHandle(h);
        }
    }
}
"@

try {
    Add-Type -TypeDefinition $source -ErrorAction SilentlyContinue
} catch {}

$success = $false
try {
    if ($Action -eq "Suspend") {
        $success = [Win32ProcessSuspender]::Suspend($ProcessId)
    } else {
        $success = [Win32ProcessSuspender]::Resume($ProcessId)
    }
} catch {
    $success = $false
}

[PSCustomObject]@{
    success = $success
    action = $Action
    pid = $ProcessId
} | ConvertTo-Json -Compress
