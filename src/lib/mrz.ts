/**
 * MRZ (Machine Readable Zone) Validator for TD3 (Passports)
 */

export function validateMRZChecksum(str: string): boolean {
  const checkDigit = parseInt(str.slice(-1), 10);
  const body = str.slice(0, -1);
  
  const weights = [7, 3, 1];
  let sum = 0;
  
  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    let val = 0;
    
    if (char >= '0' && char <= '9') {
      val = parseInt(char, 10);
    } else if (char >= 'A' && char <= 'Z') {
      val = char.charCodeAt(0) - 55;
    } else if (char === '<') {
      val = 0;
    }
    
    sum += val * weights[i % 3];
  }
  
  return (sum % 10) === checkDigit;
}

export function parseMRZ(lines: string[]) {
  if (lines.length < 2) return null;
  
  const line1 = lines[0].padEnd(44, '<');
  const line2 = lines[1].padEnd(44, '<');
  
  // Line 1: P<USAREPUBLIC<<JOHN<DOE<<<<<<<<<<<<<<<<<<<<
  const type = line1[0];
  const country = line1.slice(2, 5);
  const namePart = line1.slice(5);
  const [surname, givenNamesRaw] = namePart.split('<<');
  const givenNames = givenNamesRaw ? givenNamesRaw.replace(/</g, ' ').trim() : '';
  
  // Line 2: 1234567890USA8001014M2501012<<<<<<<<<<<<<<06
  const passportNumber = line2.slice(0, 9).replace(/</g, '');
  const passportCheck = line2[9];
  const nationality = line2.slice(10, 13);
  const dob = line2.slice(13, 19);
  const dobCheck = line2[19];
  const sex = line2[20];
  const expiry = line2.slice(21, 27);
  const expiryCheck = line2[27];
  
  const isPassportValid = validateMRZChecksum(line2.slice(0, 10));
  const isDobValid = validateMRZChecksum(line2.slice(13, 20));
  const isExpiryValid = validateMRZChecksum(line2.slice(21, 28));
  
  return {
    passportNumber,
    nationality,
    dob,
    sex,
    expiry,
    surname: surname.replace(/</g, ' ').trim(),
    givenNames,
    isValid: isPassportValid && isDobValid && isExpiryValid
  };
}
