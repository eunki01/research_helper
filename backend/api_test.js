// api_test_full_authenticated.js - 인증/컬렉션 포함 전체 API 엔드포인트 테스트

const API_BASE_URL = 'http://localhost:8000';

// --- 테스트 환경 설정 ---
const TEST_USER_EMAIL = 'test@example.com'; // Postgres에 삽입한 사용자 이메일
const TEST_USER_PASSWORD = 'testpassword123';     // 실제 해시된 비밀번호의 원본 비밀번호

// 테스트에 사용할 샘플 ID (DB에 존재하는 값으로 가정)
const TEST_AUTHOR_ID = 1;
const TEST_PAPER_ID_1 = 1;
const TEST_PAPER_ID_2 = 2; 
const TEST_PAPER_ID_3 = 3; 

let authToken = null; // 로그인 후 여기에 토큰 저장
let testCollectionId = null; // 컬렉션 생성 후 여기에 ID 저장

// --- 헬퍼 함수 (색상 및 로깅) ---
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(color, ...args) { console.log(color, ...args, colors.reset); }
function logSuccess(message) { log(colors.green, '✅', message); }
function logError(message) { log(colors.red, '❌', message); }
function logInfo(message) { log(colors.cyan, 'ℹ️ ', message); }
function logSection(message) {
    console.log('\n' + '='.repeat(60));
    log(colors.yellow, `📋 ${message}`);
    console.log('='.repeat(60));
}

// API 호출 헬퍼 함수
async function apiCall(method, endpoint, body = null, token = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        // multipart/form-data 가 필요한 login을 제외하고 모두 JSON
        'Content-Type': (endpoint === '/users/login') ? 'application/x-www-form-urlencoded' : 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = { method, headers };
    
    // 요청 본문 처리
    if (body) {
        if (options.headers['Content-Type'] === 'application/json') {
            options.body = JSON.stringify(body);
        } else if (options.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
            // FastAPI의 OAuth2PasswordRequestForm에 맞추기 위해 폼 데이터 인코딩
            const params = new URLSearchParams(body).toString();
            options.body = params;
        }
    }
    
    try {
        logInfo(`${method} ${endpoint}`);
        const response = await fetch(url, options);
        
        let data = {};
        if (response.status !== 204) {
             data = await response.json();
        }
        
        if (response.ok) {
            logSuccess(`Status: ${response.status}`);
            return { success: true, status: response.status, data };
        } else {
            logError(`Status: ${response.status} - ${data.detail || 'Error'}`);
            return { success: false, status: response.status, data };
        }
    } catch (error) {
        logError(`Network Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// --- 인증 Endpoints Test ---
async function testAuthEndpoints() {
    logSection('AUTHENTICATION ENDPOINTS TEST');

    // 1. 로그인 (POST /users/login)
    console.log('\n1. User Login:');
    const loginBody = {
        username: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
    };
    
    // FastAPI OAuth2PasswordRequestForm은 form-data를 기대하므로 body를 form-urlencoded로 변환해야 함
    const loginResult = await apiCall('POST', '/users/login', loginBody);
    
    if (loginResult.success && loginResult.data.access_token) {
        authToken = loginResult.data.access_token;
        logSuccess(`Login successful. Token acquired: ${authToken.substring(0, 10)}...`);
    } else {
        logError('Login failed. Cannot proceed with Collection tests.');
        // 테스트 실패 시 프로그램 강제 종료 (컬렉션 테스트는 토큰 필수)
        process.exit(1); 
    }
}


// --- Author Endpoints Test ---
async function testAuthorEndpoints() {
    logSection('AUTHOR ENDPOINTS TEST');
    
    // 1. 저자 검색 (GET /authors/search)
    console.log('\n1. Search Authors:');
    const searchResult = await apiCall('GET', '/authors/search?query=Hinton&limit=2');
    if (searchResult.success) {
        console.log(`   Found ${searchResult.data.length} authors`);
    }
    
    // 2. 저자 상세 (GET /authors/{author_id})
    console.log(`\n2. Author Detail (ID=${TEST_AUTHOR_ID}):`);
    const detailResult = await apiCall('GET', `/authors/${TEST_AUTHOR_ID}`);
    if (detailResult.success) {
        console.log(`   Name: ${detailResult.data.name}`);
    }
    
    // 3. 저자 논문 목록 (GET /authors/{author_id}/papers)
    console.log(`\n3. Author Papers (ID=${TEST_AUTHOR_ID}):`);
    const papersResult = await apiCall('GET', `/authors/${TEST_AUTHOR_ID}/papers?limit=3`);
    if (papersResult.success) {
        console.log(`   Found ${papersResult.data.length} papers`);
    }
    
    // 4. 공동 저자 목록 (GET /authors/{author_id}/coauthors)
    console.log(`\n4. Co-authors (ID=${TEST_AUTHOR_ID}):`);
    const coauthorsResult = await apiCall('GET', `/authors/${TEST_AUTHOR_ID}/coauthors?limit=3`);
    if (coauthorsResult.success) {
        console.log(`   Found ${coauthorsResult.data.length} co-authors`);
    }
}


// --- Collection Endpoints Test (인증 필수) ---
async function testCollectionEndpoints() {
    logSection('COLLECTION ENDPOINTS TEST');
    
    // 1. 컬렉션 생성 (POST /collections)
    console.log('\n1. Create Collection:');
    const newCollection = {
        name: 'API Test Collection',
        description: 'Temporary collection created by test script'
    };
    console.log(authToken)
    const createResult = await apiCall('POST', '/collections', newCollection, authToken);
    
    if (createResult.success) {
        console.log('Full Response Data:', createResult.data);
        testCollectionId = createResult.data.CollectionId;
        console.log(`   Created collection ID: ${testCollectionId}`);
    } else {
        logError('Collection creation failed. Stopping collection tests.');
        return;
    }
    
    // 2. 컬렉션 목록 조회 (GET /collections)
    console.log('\n2. Get All Collections:');
    const collectionsResult = await apiCall('GET', '/collections', null, authToken);
    if (collectionsResult.success) {
        console.log(`   Found ${collectionsResult.data.length} collections`);
    }

    // 3. 논문 추가 (POST /collections/{collection_id}/papers)
    console.log(`\n3. Add Paper (ID=${TEST_PAPER_ID_1}) to Collection:`);
    const addPaperResult = await apiCall('POST', `/collections/${testCollectionId}/papers`, 
        { paper_id: TEST_PAPER_ID_1 }, authToken);
    if (addPaperResult.success) {
        logSuccess('   Paper added successfully');
    }
    
    // 4. 컬렉션 논문 목록 (GET /collections/{collection_id}/papers)
    console.log('\n4. Get Collection Papers:');
    const papersResult = await apiCall('GET', `/collections/${testCollectionId}/papers`, null, authToken);
    if (papersResult.success) {
        console.log(`   Found ${papersResult.data.length} papers in collection`);
    }
    
    // 5. 컬렉션 추천 (GET /collections/{collection_id}/recommendations)
    console.log('\n5. Get Collection Recommendations:');
    const recsResult = await apiCall('GET', `/collections/${testCollectionId}/recommendations?limit=3`, null, authToken);
    if (recsResult.success) {
        console.log(`   Found ${recsResult.data.length} recommendations`);
    }
    
    // 6. 컬렉션 통계 (GET /collections/{collection_id}/stats)
    console.log('\n6. Get Collection Stats:');
    const statsResult = await apiCall('GET', `/collections/${testCollectionId}/stats`, null, authToken);
    if (statsResult.success) {
        console.log(`   Paper count: ${statsResult.data.paper_count}`);
    }
    
    // 7. 논문 제거 (DELETE /collections/{collection_id}/papers/{paper_id})
    console.log(`\n7. Remove Paper (ID=${TEST_PAPER_ID_1}) from Collection:`);
    const removeResult = await apiCall('DELETE', `/collections/${testCollectionId}/papers/${TEST_PAPER_ID_1}`, null, authToken);
    if (removeResult.success) {
        logSuccess('   Paper removed successfully');
    }
    
    // 8. 컬렉션 삭제 (DELETE /collections/{collection_id})
    console.log('\n8. Delete Collection:');
    const deleteResult = await apiCall('DELETE', `/collections/${testCollectionId}`, null, authToken);
    if (deleteResult.success) {
        logSuccess('   Collection deleted successfully');
    }
    
    // 9. 존재하지 않는 컬렉션 조회 (404 테스트)
    console.log('\n9. Get Non-existent Collection (404 Test):');
    const notFoundResult = await apiCall('GET', `/collections/${testCollectionId}`, null, authToken);
    if (!notFoundResult.success && notFoundResult.status === 404) {
        logSuccess('   Correctly returned 404 Not Found');
    }
}


// --- Paper Endpoints Test ---
async function testPaperEndpoints() {
    logSection('PAPER ENDPOINTS TEST');
    
    // 1. 논문 검색 (GET /papers/search)
    console.log('\n1. Search Papers:');
    const searchResult = await apiCall('GET', '/papers/search?query=deep&limit=2');
    if (searchResult.success) {
        console.log(`   Found ${searchResult.data.length} papers`);
    }
    
    // 2. 트렌딩 논문 (GET /papers/trending)
    console.log('\n2. Trending Papers:');
    const trendingResult = await apiCall('GET', '/papers/trending?limit=3');
    if (trendingResult.success) {
        console.log(`   Found ${trendingResult.data.length} papers`);
    }
    
    // 3. 논문 상세 (GET /papers/{paper_id})
    console.log(`\n3. Paper Detail (ID=${TEST_PAPER_ID_1}):`);
    const detailResult = await apiCall('GET', `/papers/${TEST_PAPER_ID_1}`);
    if (detailResult.success) {
        console.log(`   Title: ${detailResult.data.Title}`);
    }
    
    // 4. 논문 통계 (GET /papers/{paper_id}/stats)
    console.log(`\n4. Paper Stats (ID=${TEST_PAPER_ID_1}):`);
    const statsResult = await apiCall('GET', `/papers/${TEST_PAPER_ID_1}/stats`);
    if (statsResult.success) {
        console.log(`   Reference count: ${statsResult.data.reference_count}`);
    }
    
    // 5. References (GET /papers/{paper_id}/references)
    console.log(`\n5. Paper References (ID=${TEST_PAPER_ID_2}):`);
    const referencesResult = await apiCall('GET', `/papers/${TEST_PAPER_ID_2}/references?limit=5`);
    if (referencesResult.success) {
        console.log(`   Found ${referencesResult.data.length} references`);
    }
    
    // 6. Citations (GET /papers/{paper_id}/citations)
    console.log(`\n6. Paper Citations (ID=${TEST_PAPER_ID_3}):`);
    const citationsResult = await apiCall('GET', `/papers/${TEST_PAPER_ID_3}/citations?limit=5`);
    if (citationsResult.success) {
        console.log(`   Found ${citationsResult.data.length} citations`);
    }
    
    // 7. Similar Papers (Co-Citation) (GET /papers/{paper_id}/similar)
    console.log(`\n7. Similar Papers (ID=${TEST_PAPER_ID_1}, Co-Citation):`);
    const similarResult = await apiCall('GET', `/papers/${TEST_PAPER_ID_1}/similar?algorithm=co_citation&limit=3`);
    if (similarResult.success) {
        console.log(`   Found ${similarResult.data.length} similar papers`);
    }
    
    // 8. Citation Network (GET /papers/{paper_id}/network)
    console.log(`\n8. Citation Network (ID=${TEST_PAPER_ID_2}):`);
    const networkResult = await apiCall('GET', `/papers/${TEST_PAPER_ID_2}/network?depth=1`);
    if (networkResult.success) {
        console.log(`   Nodes: ${networkResult.data.nodes.length}`);
    }
}


// --- 메인 실행 함수 ---
async function runAllTests() {
    console.log('\n');
    log(colors.blue, '╔════════════════════════════════════════════════════════════╗');
    log(colors.blue, '║          RESEARCH HELPER API TEST SUITE (AUTH ENABLED)       ║');
    log(colors.blue, '╚════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    logInfo(`Testing API at: ${API_BASE_URL}`);
    logInfo('Make sure your backend server is running and test user exists!\n');
    
    try {
        // 1. 인증 테스트 (토큰 획득)
        await testAuthEndpoints();

        // 2. Paper 엔드포인트 테스트
        await testPaperEndpoints();
        
        // 3. Author 엔드포인트 테스트
        await testAuthorEndpoints();
        
        // 4. Collection 엔드포인트 테스트 (획득된 토큰 사용)
        if (authToken) {
            await testCollectionEndpoints();
        } else {
             logError('Skipped Collection tests due to authentication failure.');
        }
        
        // 최종 요약
        logSection('TEST SUMMARY');
        logSuccess('All available tests completed!');
        logInfo('Check the results above for any failures (e.g., 404, Network Error).');
        
    } catch (error) {
        logError(`Unexpected critical error: ${error.message}`);
        console.error(error);
    }
}

// 스크립트 실행
runAllTests();