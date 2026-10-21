param(
    [ValidateSet('ssh', 'scp')][string]$Transport = 'ssh',
    [Parameter(Mandatory=$true)][string[]]$RemoteArguments
)
$ErrorActionPreference = 'Stop'
$sourceKey = 'C:\Users\robbi\Documents\StageOneEducation\AI Key\rkipp_id_ed25519'
$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$secureDirectory = Join-Path $tempRoot ('stageone-deploy-' + [Guid]::NewGuid().ToString('N'))
$keyCopy = Join-Path $secureDirectory 'id_ed25519'
$resultCode = 1
try {
    New-Item -ItemType Directory -Path $secureDirectory | Out-Null
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetOwner($identity)
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object Security.AccessControl.FileSystemAccessRule($identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $acl.AddAccessRule($rule)
    Set-Acl -LiteralPath $secureDirectory -AclObject $acl
    Copy-Item -LiteralPath $sourceKey -Destination $keyCopy
    & $Transport -i $keyCopy -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15 @RemoteArguments
    $resultCode = $LASTEXITCODE
} finally {
    $resolved = [IO.Path]::GetFullPath($secureDirectory)
    if (!$resolved.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($resolved) -notlike 'stageone-deploy-*') {
        throw 'Refusing cleanup outside the deployment temporary directory.'
    }
    if (Test-Path -LiteralPath $secureDirectory) {
        Remove-Item -LiteralPath $secureDirectory -Recurse -Force
    }
}
exit $resultCode
