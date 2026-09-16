param(
    [Parameter(Mandatory=$false)]
    [string[]]$ProcessIds
)

$source = @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

public class ProcessPebReader {
    [DllImport("ntdll.dll")]
    public static extern int NtQueryInformationProcess(IntPtr processHandle, int processInformationClass, ref PROCESS_BASIC_INFORMATION processInformation, int processInformationLength, out int returnLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr OpenProcess(int processAccess, bool bInheritHandle, int processId);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool ReadProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress, [Out] byte[] lpBuffer, int dwSize, out IntPtr lpNumberOfBytesRead);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool CloseHandle(IntPtr hObject);

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_BASIC_INFORMATION {
        public IntPtr ExitStatus;
        public IntPtr PebBaseAddress;
        public IntPtr AffinityMask;
        public IntPtr BasePriority;
        public IntPtr UniqueProcessId;
        public IntPtr InheritedFromUniqueProcessId;
    }

    public static string GetCwd(int pid) {
        IntPtr hProcess = OpenProcess(0x0410, false, pid); // PROCESS_QUERY_INFORMATION | PROCESS_VM_READ
        if (hProcess == IntPtr.Zero) return null;
        try {
            PROCESS_BASIC_INFORMATION pbi = new PROCESS_BASIC_INFORMATION();
            int returnLength;
            int status = NtQueryInformationProcess(hProcess, 0, ref pbi, Marshal.SizeOf(pbi), out returnLength);
            if (status != 0 || pbi.PebBaseAddress == IntPtr.Zero) return null;

            bool is64 = IntPtr.Size == 8;
            IntPtr bytesRead;

            if (is64) {
                byte[] pebBuffer = new byte[0x30];
                if (!ReadProcessMemory(hProcess, pbi.PebBaseAddress, pebBuffer, pebBuffer.Length, out bytesRead)) return null;
                IntPtr procParamsAddr = new IntPtr(BitConverter.ToInt64(pebBuffer, 0x20));
                if (procParamsAddr == IntPtr.Zero) return null;

                byte[] paramsBuffer = new byte[0x50];
                if (!ReadProcessMemory(hProcess, procParamsAddr, paramsBuffer, paramsBuffer.Length, out bytesRead)) return null;
                short curDirLen = BitConverter.ToInt16(paramsBuffer, 0x38);
                IntPtr curDirBuffer = new IntPtr(BitConverter.ToInt64(paramsBuffer, 0x40));
                if (curDirBuffer == IntPtr.Zero || curDirLen <= 0) return null;

                byte[] pathBytes = new byte[curDirLen];
                if (!ReadProcessMemory(hProcess, curDirBuffer, pathBytes, pathBytes.Length, out bytesRead)) return null;
                string dir = Encoding.Unicode.GetString(pathBytes);
                if (!string.IsNullOrEmpty(dir)) {
                    dir = dir.TrimEnd('\0');
                    if (dir.EndsWith("\\")) dir = dir.Substring(0, dir.Length - 1);
                }
                return dir;
            }
            return null;
        } catch {
            return null;
        } finally {
            CloseHandle(hProcess);
        }
    }
}
"@

try {
    Add-Type -TypeDefinition $source -ErrorAction SilentlyContinue
} catch {}

$pidsList = @()
if ($ProcessIds) {
    foreach ($item in $ProcessIds) {
        $splits = $item.Split(',')
        foreach ($s in $splits) {
            $parsed = 0
            if ([int]::TryParse($s.Trim(), [ref]$parsed)) {
                $pidsList += $parsed
            }
        }
    }
}

$results = @()
foreach ($pidNum in $pidsList) {
    $cwd = $null
    try {
        $cwd = [ProcessPebReader]::GetCwd($pidNum)
    } catch {}
    $results += [PSCustomObject]@{
        pid = $pidNum
        cwd = $cwd
    }
}

$results | ConvertTo-Json -Compress
