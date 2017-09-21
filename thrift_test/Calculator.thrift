/*
 * DAO 구조체는 사용하지 않는다. 나는 오로지 숫자만 사용하는 사칙연산만 구현할 거니까
 */

 namespace js ThriftCalc

// 익숙한 이름으로 커스텀 타입 정의를 한다.
typedef i32 int
typedef i64 long

service CalculatorService {

    // 살아 있는지 체크용 함수
    void ping(),

    // 덧셈 함수
    long plus(1:int num1, 2:int num2),

    // 뺄셈 함수
    long minus(1:int num1, 2:int num2)
}
