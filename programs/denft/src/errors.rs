use anchor_lang::error_code;


// Error codes
#[error_code]
pub enum DenftError {
  #[msg("Invalid file size. Must be between 1 byte and 10MB.")]
  InvalidFileSize,

  #[msg("IPFS hash too long. Maximum 100 characters.")]
  IpfsHashTooLong,

  #[msg("Content type too long. Maximum 100 characters.")]
  ContentTypeTooLong,

  #[msg("Description too long. Maximum 500 characters.")]
  DescriptionTooLong,

  #[msg("File limit exceeded. Maximum 1GB per user.")]
  FileLimitExceeded,

  #[msg("Storage limit exceeded. Maximum 1GB per user.")]
  StorageLimitExceeded,

  #[msg("Invalid permissions. Must be between 1 and 7.")]
  InvalidPermissions,

  #[msg("Invalid expiration time. Must be in the future.")]
  InvalidExpirationTime,

  #[msg("Access already revoked.")]
  AccessAlreadyRevoked,

  #[msg("File has mismatch. File may have been tempered with.")]
  FileHashMismatch,

  #[msg("File is not active.")]
  FileNotActive,

  #[msg("Access has been revoked.")]
  AccessRevoked,

  #[msg("Access has expired.")]
  AccessExpired,

  #[msg("Download limit exceeded.")]
  DownloadLimitExceeded,

  #[msg("File already deleted.")]
  FileAlreadyDeleted,

  #[msg("Unauthorized operation.")]
  Unauthorized,

  #[msg("User account is inactive.")]
  UserAccountInactive,

  #[msg("Invalid access permission.")]
  InvalidAccessPermission,
}